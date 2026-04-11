"use server";

import pool from "@/lib/db";

/**
 * CREATE PRODUCT
 */
export const createProduct = async (data) => {
  try {
    const { shop_id, category_id, name, description, picture_url } = data;

    const result = await pool.query(
      `INSERT INTO products (shop_id, category_id, name, description, picture_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, shop_id, category_id, name, description, picture_url, created_at, updated_at`,
      [shop_id, category_id, name, description || null, picture_url || null],
    );

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET ALL PRODUCTS (excluding soft-deleted)
 */
export const getAllProducts = async () => {
  try {
    const result = await pool.query(
      `SELECT id, shop_id, category_id, name, description, picture_url, created_at, updated_at
       FROM products
       WHERE deleted_at IS NULL`,
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET PRODUCT BY ID
 */
export const getProductById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, shop_id, category_id, name, description, picture_url, created_at, updated_at
       FROM products
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Product not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET PRODUCTS BY SHOP
 */
export const getProductsByShop = async (shop_id) => {
  try {
    const result = await pool.query(
      `SELECT id, shop_id, category_id, name, description, picture_url, created_at, updated_at
       FROM products
       WHERE shop_id = $1 AND deleted_at IS NULL`,
      [shop_id],
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET PRODUCTS BY CATEGORY
 */
export const getProductsByCategory = async (category_id) => {
  try {
    const result = await pool.query(
      `SELECT id, shop_id, category_id, name, description, picture_url, created_at, updated_at
       FROM products
       WHERE category_id = $1 AND deleted_at IS NULL`,
      [category_id],
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET PRODUCTS WITH PRICES BY SHOP
 */
export const getProductsWithPricesByShop = async (shop_id) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pp.id as price_id, pp.quantity as price_quantity, pp.price
       FROM products p
       LEFT JOIN product_prices pp ON p.id = pp.product_id
       WHERE p.shop_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.id ASC, pp.quantity ASC`,
      [shop_id],
    );

    // Grouping prices by product
    const productsMap = {};
    result.rows.forEach((row) => {
      if (!productsMap[row.id]) {
        productsMap[row.id] = {
          ...row,
          prices: [],
        };
        // Remove individual price fields from main product object
        delete productsMap[row.id].price_id;
        delete productsMap[row.id].price_quantity;
        delete productsMap[row.id].price;
      }
      if (row.price_id) {
        productsMap[row.id].prices.push({
          id: row.price_id,
          quantity: row.price_quantity,
          price: row.price,
        });
      }
    });

    return Object.values(productsMap);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * UPDATE PRODUCT (dynamic)
 */
export const updateProduct = async (id, updates) => {
  try {
    const allowedFields = ["name", "description", "picture_url", "category_id"];

    const keys = Object.keys(updates).filter((key) =>
      allowedFields.includes(key),
    );

    if (keys.length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = keys.map((key) => updates[key]);

    values.push(id);

    const query = `
      UPDATE products
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1} AND deleted_at IS NULL
      RETURNING id, shop_id, category_id, name, description, picture_url, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Product not found or already deleted");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * SOFT DELETE PRODUCT
 */
export const deleteProduct = async (id) => {
  try {
    const result = await pool.query(
      `UPDATE products
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Product not found or already deleted");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * RESTORE PRODUCT (optional)
 */
export const restoreProduct = async (id) => {
  try {
    const result = await pool.query(
      `UPDATE products
       SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING id, name`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Product not found or not deleted");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};
