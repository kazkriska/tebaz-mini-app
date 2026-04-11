"use server";

import pool from "@/lib/db";

/**
 * CREATE ORDER (basic)
 */
export const createOrder = async (data) => {
  try {
    const { customer_id, shop_id, cart_id } = data;

    const result = await pool.query(
      `INSERT INTO orders (customer_id, shop_id, cart_id)
       VALUES ($1, $2, $3)
       RETURNING id, customer_id, shop_id, cart_id, status, created_at, updated_at`,
      [customer_id, shop_id, cart_id || null],
    );

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * CREATE ORDER (advanced)
 */
export const createOrderFromCart = async (cart_id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get cart
    const cartRes = await client.query(`SELECT * FROM carts WHERE id = $1`, [
      cart_id,
    ]);

    if (cartRes.rows.length === 0) {
      throw new Error("Cart not found");
    }

    const cart = cartRes.rows[0];

    // 2. Create order
    const orderRes = await client.query(
      `INSERT INTO orders (customer_id, shop_id, cart_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [cart.customer_id, cart.shop_id, cart.id],
    );

    // 3. Mark cart as checked_out
    await client.query(
      `UPDATE carts
       SET status = 'checked_out', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [cart_id],
    );

    await client.query("COMMIT");

    return orderRes.rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    throw e;
  } finally {
    client.release();
  }
};

/**
 * GET ALL ORDERS
 */
export const getAllOrders = async () => {
  try {
    const result = await pool.query(
      `SELECT id, customer_id, shop_id, cart_id, status, created_at, updated_at
       FROM orders`,
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET ORDER BY ID
 */
export const getOrderById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, customer_id, shop_id, cart_id, status, created_at, updated_at
       FROM orders
       WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Order not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET ORDERS BY CUSTOMER
 */
export const getOrdersByCustomer = async (customer_id) => {
  try {
    const result = await pool.query(
      `SELECT id, customer_id, shop_id, cart_id, status, created_at, updated_at
       FROM orders
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [customer_id],
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET ORDERS BY SHOP (for vendors)
 */
export const getOrdersByShop = async (shop_id) => {
  try {
    const result = await pool.query(
      `SELECT id, customer_id, shop_id, cart_id, status, created_at, updated_at
       FROM orders
       WHERE shop_id = $1
       ORDER BY created_at DESC`,
      [shop_id],
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * UPDATE ORDER (status only)
 */
export const updateOrder = async (id, updates) => {
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
      UPDATE orders
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1}
      RETURNING id, customer_id, shop_id, cart_id, status, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Order not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * DELETE ORDER (rarely used in real apps)
 */
export const deleteOrder = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM orders
       WHERE id = $1
       RETURNING id, customer_id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Order not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};
