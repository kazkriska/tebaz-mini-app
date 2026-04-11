"use server";

import pool from "@/lib/db";

/**
 * CREATE ORDER ITEM (basic)
 */
export const createOrderItem = async (data) => {
  try {
    const { order_id, product_name, price_at_purchase, quantity } = data;

    const result = await pool.query(
      `INSERT INTO order_items (order_id, product_name, price_at_purchase, quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING id, order_id, product_name, price_at_purchase, quantity, created_at`,
      [order_id, product_name, price_at_purchase, quantity],
    );

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * CREATE ORDER ITEM (advanced)
 */
export const createOrderItemsFromCart = async (order_id, cart_id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get cart items with product + price snapshot
    const cartItems = await client.query(
      `SELECT ci.quantity,
              pp.price,
              p.name
       FROM cart_items ci
       JOIN product_prices pp ON ci.product_price_id = pp.id
       JOIN products p ON pp.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cart_id],
    );

    if (cartItems.rows.length === 0) {
      throw new Error("Cart is empty");
    }

    // Insert into order_items
    for (const item of cartItems.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_name, price_at_purchase, quantity)
         VALUES ($1, $2, $3, $4)`,
        [order_id, item.name, item.price, item.quantity],
      );
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    throw e;
  } finally {
    client.release();
  }
};

/**
 * GET ITEMS BY ORDER
 */
export const getOrderItemsByOrder = async (order_id) => {
  try {
    const result = await pool.query(
      `SELECT id, order_id, product_name, price_at_purchase, quantity, created_at
       FROM order_items
       WHERE order_id = $1`,
      [order_id],
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET ORDER ITEM BY ID
 */
export const getOrderItemById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM order_items
       WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Order item not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * UPDATE ORDER ITEM (rarely used in real systems)
 */
export const updateOrderItem = async (id, updates) => {
  try {
    const allowedFields = ["product_name", "price_at_purchase", "quantity"];

    const keys = Object.keys(updates).filter((key) =>
      allowedFields.includes(key),
    );

    if (keys.length === 0) {
      throw new Error("No valid fields provided for update");
    }

    if (updates.quantity && updates.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    if (updates.price_at_purchase && updates.price_at_purchase < 0) {
      throw new Error("Price must be >= 0");
    }

    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = keys.map((key) => updates[key]);

    values.push(id);

    const query = `
      UPDATE order_items
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING id, order_id, product_name, price_at_purchase, quantity, created_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Order item not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * DELETE ORDER ITEM (rarely used)
 */
export const deleteOrderItem = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM order_items
       WHERE id = $1
       RETURNING id, order_id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Order item not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};
