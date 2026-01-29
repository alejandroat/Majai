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

// Helper para generar número de contrato
const generateContractNumber = (arrendamientoId) => {
    // Convertir el ID a un número de 4 dígitos con ceros a la izquierda
    return arrendamientoId.toString().padStart(4, '0');
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
            montoPagado,
            observaciones
        } = req.body;

        // Verificar que el inventario existe
        const inventario = await Inventario.findByPk(idInventario);
        if (!inventario) {
            console.log('Inventario no encontrado para id:', idInventario);
            return res.status(404).json({ message: 'Inventario no encontrado' });
        }

        // Convertir fechas a formato YYYY-MM-DD (solo fecha)
        const fechaInicioDate = new Date(fechaInicio).toISOString().split('T')[0];
        const fechaFinDate = new Date(fechaFin).toISOString().split('T')[0];
        console.log('Fechas procesadas - Inicio:', fechaInicioDate, 'Fin:', fechaFinDate);

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
            montoPagado: montoPagado || 0,
            observaciones: observaciones || null
        });
        console.log('Arrendamiento creado con ID:', arrendamiento);

        // Actualizar el estado del inventario a no disponible
        await inventario.update({ estado: false });

        // Generar PDF del contrato
        const fechaAlquiler = new Date();
        const numeroContrato = generateContractNumber(arrendamiento.id);
        const pdfData = {
            fecha_alquiler: formatDate(fechaAlquiler),
            fecha_entrega: fechaInicioDate,
            fecha_reintegro: fechaFinDate,
            nombre_cliente: NombreCliente,
            documento_cliente: identificacionCliente,
            direccion_cliente: direccionCliente || 'No especificada',
            telefono_cliente1: telefonoCliente || '',
            telefono_cliente2: '',
            valor_total_alquiler: formatNumber(valor),
            detalle_prendas_rows: 
            `<tr>
            <td>${inventario.codigo}</td>
            <td>${inventario.descripcion || 'Vestido de alquiler'}</td>
            <td>${inventario.color || 'No especificado'}</td>
            <td>${inventario.talla || 'No especificada'}</td>  
            <td>${formatNumber(valor)}</td>
            </tr>`,
            valor_deposito: formatNumber(deposito || 0),
            monto_pagado: formatNumber(montoPagado || 0),
            descripcion_vestido: `${inventario.descripcion || 'Vestido'} - Código: ${inventario.codigo}`,
            valor_alquiler: formatNumber(valor),
            dia_firma: fechaAlquiler.getDate(),
            mes_firma: fechaAlquiler.toLocaleDateString('es-CO', { month: 'long' }),
            anio_firma: fechaAlquiler.getFullYear(),
            observaciones: observaciones || '',
            numero_contrato: numeroContrato
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

// Crear un nuevo arrendamiento sin generar PDF
exports.createArrendamientoSinPDF = async (req, res, next) => {
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
            montoPagado,
            observaciones
        } = req.body;

        // Verificar que el inventario existe
        const inventario = await Inventario.findByPk(idInventario);
        if (!inventario) {
            console.log('Inventario no encontrado para id:', idInventario);
            return res.status(404).json({ message: 'Inventario no encontrado' });
        }

        // Convertir fechas a formato YYYY-MM-DD (solo fecha)
        const fechaInicioDate = new Date(fechaInicio).toISOString().split('T')[0];
        const fechaFinDate = new Date(fechaFin).toISOString().split('T')[0];
        console.log('Fechas procesadas - Inicio:', fechaInicioDate, 'Fin:', fechaFinDate);

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
            montoPagado: montoPagado || 0,
            observaciones: observaciones || null
        });
        console.log('Arrendamiento creado sin PDF con ID:', arrendamiento.id);

        // Actualizar el estado del inventario a no disponible
        await inventario.update({ estado: false });

        // Responder solo con los datos del arrendamiento
        res.status(201).json(arrendamiento);
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

        // Fecha actual (solo fecha, sin tiempo)
        const fechaActual = new Date().toISOString().split('T')[0];

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
//Crear pdf para varios arrendamientos
exports.generateArrendamientosPDF = async (req, res, next) => { 
    try {
        const { arrendamientoIds } = req.body;

        // Validar que se recibieron los IDs
        if (!arrendamientoIds || !Array.isArray(arrendamientoIds) || arrendamientoIds.length < 1) {
            return res.status(400).json({ 
                message: 'Se requiere un array de IDs de arrendamientos' 
            });
        }

        // Buscar todos los arrendamientos con sus inventarios
        const arrendamientos = await Arrendamiento.findAll({
            where: {
                id: {
                    [Op.in]: arrendamientoIds
                }
            },
            include: [{
                model: Inventario,
                as: 'inventario'
            }]
        });

        if (arrendamientos.length === 0) {
            return res.status(404).json({ 
                message: 'No se encontraron arrendamientos con los IDs proporcionados' 
            });
        }

        // Obtener datos del primer arrendamiento para información principal del cliente
        const primerArrendamiento = arrendamientos[0];
        
        // Calcular valores totales
        let valorTotalAlquiler = 0;
        let valorTotalDeposito = 0;
        let montoPagadoTotal = 0;
        
        arrendamientos.forEach(arr => {
            valorTotalAlquiler += parseFloat(arr.valor) || 0;
            valorTotalDeposito += parseFloat(arr.deposito) || 0;
            montoPagadoTotal += parseFloat(arr.montoPagado) || 0;
        });

        // Crear filas de detalle para todas las prendas
        const detalle_prendas_rows = arrendamientos.map(arr => {
            const inv = arr.inventario;
            return `<tr>
                <td>${inv.codigo}</td>
                <td>${inv.descripcion || 'Vestido de alquiler'}</td>
                <td>${inv.color || 'No especificado'}</td>
                <td>${inv.talla || 'No especificada'}</td>
                <td>${formatNumber(arr.valor)}</td>
            </tr>`;
        }).join('');

        // Determinar fechas de entrega y reintegro (usar las más tempranas y tardías)
        const fechasInicio = arrendamientos.map(arr => new Date(arr.fechaInicio));
        const fechasFin = arrendamientos.map(arr => new Date(arr.fechaFin));
        
        const fechaEntregaMasTemprana = new Date(Math.min(...fechasInicio));
        const fechaReintegroMasTardia = new Date(Math.max(...fechasFin));
        
        const todaslasobservaciones = arrendamientos
            .map(arr => arr.observaciones)
            .filter(obs => obs && obs.trim() !== '')
            .join(' | ');

        // Generar PDF del contrato unificado
        const fechaAlquiler = new Date();
        const numeroContrato = generateContractNumber(primerArrendamiento.id);
        const pdfData = {
            fecha_alquiler: formatDate(fechaAlquiler),
            fecha_entrega: fechaEntregaMasTemprana.toISOString().split('T')[0],
            fecha_reintegro: fechaReintegroMasTardia.toISOString().split('T')[0],
            nombre_cliente: primerArrendamiento.NombreCliente,
            documento_cliente: primerArrendamiento.identificacionCliente,
            direccion_cliente: primerArrendamiento.direccionCliente || 'No especificada',
            telefono_cliente1: primerArrendamiento.telefonoCliente || '',
            telefono_cliente2: '',
            valor_total_alquiler: formatNumber(valorTotalAlquiler),
            detalle_prendas_rows: detalle_prendas_rows,
            valor_deposito: formatNumber(valorTotalDeposito),
            montoPagado: formatNumber(montoPagadoTotal),
            descripcion_vestido: `Alquiler múltiple - ${arrendamientos.length} prendas`,
            valor_alquiler: formatNumber(valorTotalAlquiler),
            dia_firma: fechaAlquiler.getDate(),
            mes_firma: fechaAlquiler.toLocaleDateString('es-CO', { month: 'long' }),
            anio_firma: fechaAlquiler.getFullYear(),
            observaciones: todaslasobservaciones || '',
            numero_contrato: numeroContrato
        };

        let pdfBase64 = null;
        let pdfFilename = `contrato_unificado_${primerArrendamiento.NombreCliente.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        
        try {
            console.log('Iniciando generación de PDF unificado para arrendamientos:', arrendamientoIds);
            const pdfBuffer = await generateAlquilerPDF(pdfData);
            pdfBase64 = pdfBuffer.toString('base64');
            console.log('PDF unificado generado correctamente, longitud base64:', pdfBase64.length);
        } catch (pdfError) {
            console.error('Error generando PDF unificado:', pdfError);
            return res.status(500).json({ 
                message: 'Error generando el PDF', 
                error: pdfError.message 
            });
        }

        const responseData = {
            arrendamientos: arrendamientos.map(arr => ({
                id: arr.id,
                codigo: arr.inventario.codigo,
                descripcion: arr.inventario.descripcion,
                valor: arr.valor
            })),
            cliente: {
                nombre: primerArrendamiento.NombreCliente,
                identificacion: primerArrendamiento.identificacionCliente
            },
            totales: {
                valorTotal: valorTotalAlquiler,
                depositoTotal: valorTotalDeposito,
                montoPagadoTotal: montoPagadoTotal
            },
            fechas: {
                entrega: fechaEntregaMasTemprana.toISOString().split('T')[0],
                reintegro: fechaReintegroMasTardia.toISOString().split('T')[0]
            },
            pdf: pdfBase64,
            pdfFilename: pdfFilename
        };
        
        console.log('Respuesta de PDF unificado enviada correctamente');
        res.status(200).json(responseData);
    } catch (err) {
        console.error('Error en generateArrendamientosPDF:', err);
        next(err);
    }
}