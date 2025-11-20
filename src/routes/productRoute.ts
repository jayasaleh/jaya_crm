// src/routes/productRoute.ts
import { Router } from "express";
import * as controller from "../controllers/productController";
import { requireAuth } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/role";
import { validate } from "../middleware/validate";
import {
  createProductSchema,
  updateProductSchema,
} from "../schema/product.schema";

const router = Router();

// Semua endpoint memerlukan autentikasi
router.use(requireAuth);

// ==============================
// Dibolehkan untuk SEMUA USER (Sales & Manager)
// ==============================

/**
 * GET /api/products
 * - Sales: lihat daftar produk aktif untuk buat penawaran
 * - Manager: lihat semua produk aktif
 */
router.get("/", controller.getAllProducts);

/**
 * GET /api/products/:id
 * - Lihat detail produk (termasuk non-aktif, untuk histori)
 */
router.get("/:id", controller.getProductById);

// ==============================
// Hanya untuk MANAGER
// ==============================

router.use(roleMiddleware("MANAGER"));

/**
 * POST /api/products
 * - Buat produk baru 
 */
router.post("/", validate(createProductSchema), controller.createProduct);

/**
 * PATCH /api/products/:id
 * - Update detail produk (termasuk nonaktifkan via isActive: false)
 */
router.patch("/:id", validate(updateProductSchema), controller.updateProduct);

/**
 * DELETE /api/products/:id
 * - Nonaktifkan produk (soft deactivate)
 * - Tidak hapus permanen agar histori Deal tetap utuh
 */
router.delete("/:id", controller.deactivateProduct);

/**
 * DELETE /api/products/:id/delete
 * - Hapus produk secara permanen dari database
 * - Hanya jika benar-benar diperlukan 
 */
router.delete("/:id/delete", controller.deleteProduct);

export default router;