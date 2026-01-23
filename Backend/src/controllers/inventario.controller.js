const { Inventario } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadPath = 'uploads/inventario/';
		// Crear directorio si no existe
		if (!fs.existsSync(uploadPath)) {
			fs.mkdirSync(uploadPath, { recursive: true });
		}
		cb(null, uploadPath);
	},
	filename: function (req, file, cb) {
		// Generar nombre único para el archivo
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		const extension = path.extname(file.originalname);
		cb(null, 'inventario-' + uniqueSuffix + extension);
	}
});

const fileFilter = (req, file, cb) => {
	// Filtrar solo imágenes
	if (file.mimetype.startsWith('image/')) {
		cb(null, true);
	} else {
		cb(new Error('Solo se permiten archivos de imagen'), false);
	}
};

const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024 // 5MB máximo
	}
});

// Middleware para subir una imagen
exports.uploadImage = upload.single('imagen');

// Crear un nuevo item de inventario
// Crear un nuevo item de inventario
exports.createInventario = async (req, res, next) => {
	try {
		const itemData = { ...req.body };
		
		// Si se subió una imagen, agregar la URL
		if (req.file) {
			itemData.imagenURL = `/uploads/inventario/${req.file.filename}`;
		}
		
		const item = await Inventario.create(itemData);
		res.status(201).json(item);
	} catch (err) {
		// Si hubo error y se subió archivo, eliminarlo
		if (req.file) {
			fs.unlink(req.file.path, (unlinkErr) => {
				if (unlinkErr) console.error('Error eliminando archivo:', unlinkErr);
			});
		}
		next(err);
	}
};

// Obtener todos los items de inventario
exports.getInventarios = async (req, res, next) => {
	try {
		const items = await Inventario.findAll();
		res.json(items);
	} catch (err) {
		next(err);
	}
};

// Obtener un item de inventario por ID
exports.getInventarioById = async (req, res, next) => {
	try {
		const item = await Inventario.findByPk(req.params.id);
		if (!item) return res.status(404).json({ message: 'No encontrado' });
		res.json(item);
	} catch (err) {
		next(err);
	}
};

// Actualizar un item de inventario
exports.updateInventario = async (req, res, next) => {
	try {
		const item = await Inventario.findByPk(req.params.id);
		if (!item) return res.status(404).json({ message: 'No encontrado' });

		const itemData = { ...req.body };
		let oldImagePath = null;

		// Si se subió una nueva imagen
		if (req.file) {
			// Guardar ruta de imagen antigua para eliminar después
			if (item.imagenURL) {
				oldImagePath = path.join('uploads/inventario/', path.basename(item.imagenURL));
			}
			itemData.imagenURL = `/uploads/inventario/${req.file.filename}`;
		}

		await item.update(itemData);

		// Eliminar imagen antigua si se subió una nueva
		if (oldImagePath && fs.existsSync(oldImagePath)) {
			fs.unlink(oldImagePath, (unlinkErr) => {
				if (unlinkErr) console.error('Error eliminando imagen antigua:', unlinkErr);
			});
		}

		res.json(item);
	} catch (err) {
		// Si hubo error y se subió archivo, eliminarlo
		if (req.file) {
			fs.unlink(req.file.path, (unlinkErr) => {
				if (unlinkErr) console.error('Error eliminando archivo:', unlinkErr);
			});
		}
		next(err);
	}
};

// Eliminar un item de inventario
exports.deleteInventario = async (req, res, next) => {
	try {
		const item = await Inventario.findByPk(req.params.id);
		if (!item) return res.status(404).json({ message: 'No encontrado' });

		// Eliminar imagen asociada si existe
		if (item.imagenURL) {
			const imagePath = path.join('uploads/inventario/', path.basename(item.imagenURL));
			if (fs.existsSync(imagePath)) {
				fs.unlink(imagePath, (unlinkErr) => {
					if (unlinkErr) console.error('Error eliminando imagen:', unlinkErr);
				});
			}
		}

		await item.destroy();
		res.json({ message: 'Eliminado correctamente' });
	} catch (err) {
		next(err);
	}
};

// Obtener imagen del inventario
exports.getInventarioImage = async (req, res, next) => {
	try {
		const item = await Inventario.findByPk(req.params.id);
		if (!item || !item.imagenURL) {
			// Enviar imagen por defecto
			return res.sendFile(path.join(__dirname, '../../public/default-image.png'));
		}

		const imagePath = path.join(__dirname, '../../uploads/inventario/', path.basename(item.imagenURL));
		
		if (fs.existsSync(imagePath)) {
			res.sendFile(imagePath);
		} else {
			// Enviar imagen por defecto
			res.sendFile(path.join(__dirname, '../../public/default-image.png'));
		}
	} catch (err) {
		next(err);
	}
};

// Exportar el middleware para uso en las rutas
exports.uploadMiddleware = upload;
