const { Abonos, Arrendamiento, User, Inventario } = require('../models');
const { Op } = require('sequelize');
const { generateAbonoPDF } = require('../pdf/pdf');

// Helper para formatear números con separador de miles
const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Helper para formatear fechas
const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

// Crear un nuevo abono
exports.createAbono = async (req, res, next) => {
    try {
        const { idArrendamiento, idUsuario, fecha, valor, tipoPago} = req.body;

        // Verificar que el arrendamiento existe con su inventario
        const arrendamiento = await Arrendamiento.findByPk(idArrendamiento, {
            include: [{
                model: Inventario,
                as: 'inventario'
            }]
        });
        if (!arrendamiento) {
            return res.status(404).json({ message: 'Arrendamiento no encontrado' });
        }

        // Verificar que el usuario existe
        const usuario = await User.findByPk(idUsuario);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Calcular el total pagado hasta ahora
        const abonosExistentes = await Abonos.findAll({
            where: { idArrendamiento }
        });

        const totalPagado = abonosExistentes.reduce((sum, abono) => sum + abono.valor, 0);
        const nuevoTotal = totalPagado + valor;

        // Verificar que no se exceda el valor del arrendamiento
        if (nuevoTotal > arrendamiento.valor) {
            return res.status(400).json({ 
                message: 'El valor del abono excede el monto pendiente del arrendamiento',
                valorArrendamiento: arrendamiento.valor,
                totalPagado,
                montoPendiente: arrendamiento.valor - totalPagado,
                valorAbono: valor
            });
        }

        // Crear el abono
        const abono = await Abonos.create({
            idArrendamiento,
            idUsuario,
            fecha: new Date(fecha),
            valor,
            tipoPago
        });

        // Generar PDF del recibo de abono
        const inventario = arrendamiento.inventario;
        const valorRestante = arrendamiento.valor - (arrendamiento.montoPagado + totalPagado) - valor;
        
        const pdfData = {
            fecha_recibo: formatDate(new Date(fecha)),
            fecha_entrega: formatDate(arrendamiento.fechaInicio),
            nombre_cliente: arrendamiento.NombreCliente,
            documento_cliente: arrendamiento.identificacionCliente,
            direccion_cliente: arrendamiento.direccionCliente || 'No especificada',
            telefono_cliente1: arrendamiento.telefonoCliente || '',
            telefono_cliente2: '',
            tipo_pago: abono.tipoPago || 'CONTADO',
           detalle_prendas_rows: 
            `<tr>
            <td>${inventario.codigo}</td>
            <td>${inventario.descripcion || 'Vestido de alquiler'}</td>
            <td>${inventario.color || 'No especificado'}</td>
            <td>${inventario.talla || 'No especificada'}</td>  
            <td>${formatNumber(valor)}</td>
            </tr>`,
            valor_deposito: formatNumber(valor),
            valor_restante: formatNumber(valorRestante)
        };

        let pdfBase64 = null;
        let pdfFilename = `recibo_abono_${abono.id}_${arrendamiento.NombreCliente.replace(/\s+/g, '_')}.pdf`;
        
        try {
            console.log('Iniciando generación de PDF para abono:', abono.id);
            const pdfBuffer = await generateAbonoPDF(pdfData);
            pdfBase64 = pdfBuffer.toString('base64');
            console.log('PDF generado correctamente, longitud base64:', pdfBase64.length);
        } catch (pdfError) {
            console.error('Error generando PDF:', pdfError);
            // Continuamos sin PDF si falla
        }

        const responseData = {
            ...abono.toJSON(),
            pdf: pdfBase64,
            pdfFilename: pdfFilename
        };
        
        console.log('Respuesta enviada con PDF:', pdfBase64 ? 'Sí' : 'No');
        res.status(201).json(responseData);
    } catch (err) {
        next(err);
    }
};

// Obtener todos los abonos
exports.getAbonos = async (req, res, next) => {
    try {
        const abonos = await Abonos.findAll({
            include: [
                {
                    model: Arrendamiento,
                    as: 'arrendamiento'
                },
                {
                    model: User,
                    as: 'usuario',
                    attributes: ['id', 'name', 'user']
                }
            ],
            order: [['fecha', 'DESC']]
        });
        res.json(abonos);
    } catch (err) {
        next(err);
    }
};

// Obtener un abono por ID
exports.getAbonoById = async (req, res, next) => {
    try {
        const abono = await Abonos.findByPk(req.params.id, {
            include: [
                {
                    model: Arrendamiento,
                    as: 'arrendamiento'
                },
                {
                    model: User,
                    as: 'usuario',
                    attributes: ['id', 'name', 'user']
                }
            ]
        });
        
        if (!abono) {
            return res.status(404).json({ message: 'Abono no encontrado' });
        }
        
        res.json(abono);
    } catch (err) {
        next(err);
    }
};

// Obtener abonos por ID de arrendamiento
exports.getAbonosByArrendamiento = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verificar que el arrendamiento existe
        const arrendamiento = await Arrendamiento.findByPk(id);
        if (!arrendamiento) {
            return res.status(404).json({ message: 'Arrendamiento no encontrado' });
        }

        // Buscar todos los abonos del arrendamiento
        const abonos = await Abonos.findAll({
            where: { idArrendamiento: id },
            include: [
                {
                    model: User,
                    as: 'usuario',
                    attributes: ['id', 'name', 'user']
                }
            ],
            order: [['fecha', 'DESC']]
        });

        // Calcular totales
        const totalPagado = abonos.reduce((sum, abono) => sum + abono.valor, 0);
        const montoPendiente = arrendamiento.valor - totalPagado;

        res.json({
            arrendamiento: {
                id: arrendamiento.id,
                valorTotal: arrendamiento.valor,
                NombreCliente: arrendamiento.NombreCliente
            },
            abonos,
            resumen: {
                totalAbonos: abonos.length,
                totalPagado,
                montoPendiente,
                porcentajePagado: ((totalPagado / arrendamiento.valor) * 100).toFixed(2)
            }
        });
    } catch (err) {
        next(err);
    }
};

// Obtener abonos por usuario
exports.getAbonosByUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verificar que el usuario existe
        const usuario = await User.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Buscar todos los abonos del usuario
        const abonos = await Abonos.findAll({
            where: { idUsuario: id },
            include: [
                {
                    model: Arrendamiento,
                    as: 'arrendamiento',
                    attributes: ['id', 'NombreCliente', 'valor']
                }
            ],
            order: [['fecha', 'DESC']]
        });

        // Calcular totales
        const totalRecibido = abonos.reduce((sum, abono) => sum + abono.valor, 0);

        res.json({
            usuario: {
                id: usuario.id,
                name: usuario.name,
                user: usuario.user
            },
            abonos,
            resumen: {
                totalAbonos: abonos.length,
                totalRecibido
            }
        });
    } catch (err) {
        next(err);
    }
};

// Actualizar un abono
exports.updateAbono = async (req, res, next) => {
    try {
        const abono = await Abonos.findByPk(req.params.id);
        if (!abono) {
            return res.status(404).json({ message: 'Abono no encontrado' });
        }

        // Si se está actualizando el valor, verificar que no se exceda el monto del arrendamiento
        if (req.body.valor && req.body.valor !== abono.valor) {
            const arrendamiento = await Arrendamiento.findByPk(abono.idArrendamiento);
            
            // Calcular total pagado sin este abono
            const otrosAbonos = await Abonos.findAll({
                where: { 
                    idArrendamiento: abono.idArrendamiento,
                    id: { [Op.ne]: abono.id }
                }
            });

            const totalOtrosAbonos = otrosAbonos.reduce((sum, otroAbono) => sum + otroAbono.valor, 0);
            const nuevoTotal = totalOtrosAbonos + req.body.valor;

            if (nuevoTotal > arrendamiento.valor) {
                return res.status(400).json({ 
                    message: 'El nuevo valor del abono excede el monto del arrendamiento',
                    valorArrendamiento: arrendamiento.valor,
                    totalOtrosAbonos,
                    montoPendiente: arrendamiento.valor - totalOtrosAbonos
                });
            }
        }

        await abono.update(req.body);
        res.json(abono);
    } catch (err) {
        next(err);
    }
};

// Eliminar un abono
exports.deleteAbono = async (req, res, next) => {
    try {
        const abono = await Abonos.findByPk(req.params.id);
        if (!abono) {
            return res.status(404).json({ message: 'Abono no encontrado' });
        }

        await abono.destroy();
        res.json({ message: 'Abono eliminado correctamente' });
    } catch (err) {
        next(err);
    }
};
