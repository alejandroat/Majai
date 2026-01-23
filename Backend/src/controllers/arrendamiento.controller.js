const { Arrendamiento, Inventario, Abonos } = require('../models');
const { Op } = require('sequelize');
const { generateAlquilerPDF } = require('../pdf/pdf');

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

// Crear un nuevo arrendamiento
exports.createArrendamiento = async (req, res, next) => {
    try {
        const { 
            fechaInicio, 
            fechaFin, 
            idInventario, 
            NombreCliente, 
            tipoDocumento,
            identificacionCliente, 
            telefonoCliente, 
            direccionCliente,
            deposito, 
            valor, 
            tipoPago, 
            montoPagado 
        } = req.body;

        // Verificar que el inventario existe
        const inventario = await Inventario.findByPk(idInventario);
        if (!inventario) {
            return res.status(404).json({ message: 'Inventario no encontrado' });
        }

        // Convertir fechas a objetos Date
        const fechaInicioDate = new Date(fechaInicio);
        const fechaFinDate = new Date(fechaFin);

        // Verificar que no existe un arrendamiento activo para el mismo inventario en las mismas fechas
        const arrendamientoExistente = await Arrendamiento.findOne({
            where: {
                idInventario: idInventario,
                [Op.or]: [
                    {
                        // La nueva fecha de inicio está dentro de un arrendamiento existente
                        fechaInicio: {
                            [Op.lte]: fechaInicioDate
                        },
                        fechaFin: {
                            [Op.gte]: fechaInicioDate
                        }
                    },
                    {
                        // La nueva fecha de fin está dentro de un arrendamiento existente
                        fechaInicio: {
                            [Op.lte]: fechaFinDate
                        },
                        fechaFin: {
                            [Op.gte]: fechaFinDate
                        }
                    },
                    {
                        // El nuevo arrendamiento contiene completamente a uno existente
                        fechaInicio: {
                            [Op.gte]: fechaInicioDate
                        },
                        fechaFin: {
                            [Op.lte]: fechaFinDate
                        }
                    }
                ]
            }
        });

        if (arrendamientoExistente) {
            return res.status(400).json({ 
                message: 'Ya existe un arrendamiento para este inventario en las fechas seleccionadas',
                arrendamientoExistente 
            });
        }

        // Crear el arrendamiento
        const arrendamiento = await Arrendamiento.create({
            fechaInicio: fechaInicioDate,
            fechaFin: fechaFinDate,
            idInventario,
            NombreCliente,
            tipoDocumento: tipoDocumento || 'CC',
            identificacionCliente,
            telefonoCliente,
            direccionCliente,
            deposito,
            valor,
            tipoPago: tipoPago || 'CONTADO',
            montoPagado: montoPagado || 0
        });

        // Actualizar el estado del inventario a no disponible
        await inventario.update({ estado: false });

        // Generar PDF del contrato
        const fechaAlquiler = new Date();
        const pdfData = {
            fecha_alquiler: formatDate(fechaAlquiler),
            fecha_entrega: formatDate(fechaInicioDate),
            fecha_reintegro: formatDate(fechaFinDate),
            nombre_cliente: NombreCliente,
            documento_cliente: identificacionCliente,
            direccion_cliente: direccionCliente || 'No especificada',
            telefono_cliente1: telefonoCliente || '',
            telefono_cliente2: '',
            valor_total_alquiler: formatNumber(valor),
            caracteristicas_prendas: `<p><strong>Código:</strong> ${inventario.codigo}</p>
                <p><strong>Descripción:</strong> ${inventario.descripcion || 'Vestido de alquiler'}</p>
                <p><strong>Color:</strong> ${inventario.color || 'No especificado'}</p>
                <p><strong>Talla:</strong> ${inventario.talla || 'No especificada'}</p>`,
            valor_deposito: formatNumber(deposito || 0),
            descripcion_vestido: `${inventario.descripcion || 'Vestido'} - Código: ${inventario.codigo}`,
            valor_alquiler: formatNumber(valor),
            dia_firma: fechaAlquiler.getDate(),
            mes_firma: fechaAlquiler.toLocaleDateString('es-CO', { month: 'long' }),
            anio_firma: fechaAlquiler.getFullYear()
        };

        let pdfBase64 = null;
        let pdfFilename = `contrato_${arrendamiento.id}_${NombreCliente.replace(/\s+/g, '_')}.pdf`;
        
        try {
            console.log('Iniciando generación de PDF para arrendamiento:', arrendamiento.id);
            const pdfBuffer = await generateAlquilerPDF(pdfData);
            pdfBase64 = pdfBuffer.toString('base64');
            console.log('PDF generado correctamente, longitud base64:', pdfBase64.length);
        } catch (pdfError) {
            console.error('Error generando PDF:', pdfError);
            // Continuamos sin PDF si falla
        }

        const responseData = {
            ...arrendamiento.toJSON(),
            pdf: pdfBase64,
            pdfFilename: pdfFilename
        };
        
        console.log('Respuesta enviada con PDF:', pdfBase64 ? 'Sí' : 'No');
        res.status(201).json(responseData);
    } catch (err) {
        next(err);
    }
};

// Obtener todos los arrendamientos
exports.getArrendamientos = async (req, res, next) => {
    try {
        const arrendamientos = await Arrendamiento.findAll({
            include: [{
                model: Inventario,
                as: 'inventario'
            },
            {
                model: Abonos,
                as: 'abonos'
            }]
        });
        res.json(arrendamientos);
    } catch (err) {
        next(err);
    }
};

// Obtener un arrendamiento por ID
exports.getArrendamientoById = async (req, res, next) => {
    try {
        const arrendamiento = await Arrendamiento.findByPk(req.params.id, {
            include: [{
                model: Inventario,
                as: 'inventario'
            },
            {
                model: Abonos,
                as: 'abonos'
            }]
        });
        if (!arrendamiento) {
            return res.status(404).json({ message: 'Arrendamiento no encontrado' });
        }
        res.json(arrendamiento);
    } catch (err) {
        next(err);
    }
};

// Obtener arrendamientos por ID de vestido/inventario
exports.getArrendamientosByVestido = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verificar que el inventario existe
        const inventario = await Inventario.findByPk(id);
        if (!inventario) {
            return res.status(404).json({ message: 'Inventario no encontrado' });
        }

        // Fecha actual
        const fechaActual = new Date();

        // Buscar arrendamientos vigentes (fechaFin no ha pasado)
        const arrendamientos = await Arrendamiento.findAll({
            where: {
                idInventario: id,
                fechaFin: {
                    [Op.gte]: fechaActual
                }
            },
            attributes: [
                'id', 
                'fechaInicio', 
                'fechaFin', 
                'NombreCliente', 
                'tipoDocumento',
                'identificacionCliente',
                'telefonoCliente', 
                'direccionCliente',
                'deposito',
                'valor',
                'tipoPago',
                'montoPagado'
            ],
            order: [
                ['fechaInicio', 'ASC']
            ]
        });

        res.json({
            inventario,
            arrendamientos,
            total: arrendamientos.length
        });
    } catch (err) {
        next(err);
    }
};

// Actualizar un arrendamiento
exports.updateArrendamiento = async (req, res, next) => {
    try {
        const arrendamiento = await Arrendamiento.findByPk(req.params.id);
        if (!arrendamiento) {
            return res.status(404).json({ message: 'Arrendamiento no encontrado' });
        }

        // Si se actualiza el estado a 'finalizado', liberar el inventario
        if (req.body.estado === 'finalizado' && arrendamiento.estado !== 'finalizado') {
            const inventario = await Inventario.findByPk(arrendamiento.idInventario);
            if (inventario) {
                await inventario.update({ estado: true });
            }
        }

        await arrendamiento.update(req.body);
        res.json(arrendamiento);
    } catch (err) {
        next(err);
    }
};

// Eliminar un arrendamiento
exports.deleteArrendamiento = async (req, res, next) => {
    try {
        const arrendamiento = await Arrendamiento.findByPk(req.params.id);
        if (!arrendamiento) {
            return res.status(404).json({ message: 'Arrendamiento no encontrado' });
        }

        // Liberar el inventario antes de eliminar
        const inventario = await Inventario.findByPk(arrendamiento.idInventario);
        if (inventario && !inventario.estado) {
            await inventario.update({ estado: true });
        }

        await arrendamiento.destroy();
        res.json({ message: 'Arrendamiento eliminado correctamente' });
    } catch (err) {
        next(err);
    }
};
