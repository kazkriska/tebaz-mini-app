"use server";

import pool from "@/lib/db";

/**
 * CREATE CART
 * (ensures one cart per customer per shop via UNIQUE constraint)
 */
export const createCart = async (customer_id, shop_id) => {
  try {
    const result = await pool.query(
      `INSERT INTO carts (customer_id, shop_id)
       VALUES ($1, $2)
       RETURNING id, customer_id, shop_id, status, created_at, updated_at`,
      [customer_id, shop_id],
    );

    return result.rows[0];
  } catch (e) {
    if (e.code === "23505") {
      throw new Error("Cart already exists for this customer and shop");
    }

    console.error(e);
    throw e;
  }
};

/**
 * GET ALL CARTS
 */
export const getAllCarts = async () => {
  try {
    const result = await pool.query(
      `SELECT id, customer_id, shop_id, status, created_at, updated_at
       FROM carts`,
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET CART BY ID
 */
export const getCartById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, customer_id, shop_id, status, created_at, updated_at
       FROM carts
       WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Cart not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET CART BY CUSTOMER + SHOP (very important)
 */
export const getCartByCustomerAndShop = async (customer_id, shop_id) => {
  try {
    const result = await pool.query(
      `SELECT id, customer_id, shop_id, status, created_at, updated_at
       FROM carts
       WHERE customer_id = $1 AND shop_id = $2`,
      [customer_id, shop_id],
    );

    return result.rows[0] || null;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET ALL CARTS FOR CUSTOMER
 */
export const getCartsByCustomer = async (customer_id) => {
  try {
    const result = await pool.query(
      `SELECT id, customer_id, shop_id, status, created_at, updated_at
       FROM carts
       WHERE customer_id = $1`,
      [customer_id],
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * UPDATE CART (status only)
 */
export const updateCart = async (id, updates) => {
  try {
    const allowedFields = ["status"];

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
      UPDATE carts
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1}
      RETURNING id, customer_id, shop_id, status, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Cart not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * DELETE CART
 */
export const deleteCart = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM carts
       WHERE id = $1
       RETURNING id, customer_id, shop_id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Cart not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};
