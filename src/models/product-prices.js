"use server";

import pool from "@/lib/db";

/**
 * CREATE PRODUCT PRICE
 */
export const createProductPrice = async (data) => {
  try {
    const { product_id, quantity, price } = data;

    const result = await pool.query(
      `INSERT INTO product_prices (product_id, quantity, price)
       VALUES ($1, $2, $3)
       RETURNING id, product_id, quantity, price, created_at, updated_at`,
      [product_id, quantity, price],
    );

    return result.rows[0];
  } catch (e) {
    // Handle unique constraint (product_id + quantity)
    if (e.code === "23505") {
      throw new Error("Price for this quantity already exists for the product");
    }

    console.error(e);
    throw e;
  }
};

/**
 * GET ALL PRICES (optionally by product)
 */
export const getProductPrices = async (product_id) => {
  try {
    const result = await pool.query(
      `SELECT id, product_id, quantity, price, created_at, updated_at
       FROM product_prices
       WHERE product_id = $1
       ORDER BY quantity ASC`,
      [product_id],
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET PRICE BY ID
 */
export const getProductPriceById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, product_id, quantity, price, created_at, updated_at
       FROM product_prices
       WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Product price not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * UPDATE PRODUCT PRICE (dynamic)
 */
export const updateProductPrice = async (id, updates) => {
  try {
    const allowedFields = ["quantity", "price"];

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
      UPDATE product_prices
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1}
      RETURNING id, product_id, quantity, price, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Product price not found");
    }

    return result.rows[0];
  } catch (e) {
    if (e.code === "23505") {
      throw new Error("This quantity already exists for the product");
    }

    console.error(e);
    throw e;
  }
};

/**
 * DELETE PRODUCT PRICE
 */
export const deleteProductPrice = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM product_prices
       WHERE id = $1
       RETURNING id, product_id, quantity`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Product price not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};
