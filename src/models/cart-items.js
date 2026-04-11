"use server";

import pool from "@/lib/db";

/**
 * ADD ITEM TO CART
 * (if same product_price_id exists → increment quantity)
 */
export const addCartItem = async (cart_id, product_price_id, quantity) => {
  try {
    // Check if item already exists in cart
    const existing = await pool.query(
      `SELECT id, quantity
       FROM cart_items
       WHERE cart_id = $1 AND product_price_id = $2`,
      [cart_id, product_price_id],
    );

    if (existing.rows.length > 0) {
      // Update quantity instead of inserting new row
      const updated = await pool.query(
        `UPDATE cart_items
         SET quantity = quantity + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [quantity, existing.rows[0].id],
      );

      return updated.rows[0];
    }

    // Insert new item
    const result = await pool.query(
      `INSERT INTO cart_items (cart_id, product_price_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING id, cart_id, product_price_id, quantity, created_at, updated_at`,
      [cart_id, product_price_id, quantity],
    );

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET ALL ITEMS IN A CART
 */
export const getCartItems = async (cart_id) => {
  try {
    const result = await pool.query(
      `SELECT ci.id, ci.cart_id, ci.product_price_id, ci.quantity,
              ci.created_at, ci.updated_at,
              pp.price, pp.quantity AS price_quantity,
              p.name AS product_name
       FROM cart_items ci
       JOIN product_prices pp ON ci.product_price_id = pp.id
       JOIN products p ON pp.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cart_id],
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET CART TOTAL PRICE
 */
export const getCartTotal = async (cart_id) => {
  const result = await pool.query(
    `SELECT SUM(ci.quantity * pp.price) AS total
     FROM cart_items ci
     JOIN product_prices pp ON ci.product_price_id = pp.id
     WHERE ci.cart_id = $1`,
    [cart_id],
  );

  return result.rows[0].total || 0;
};

/**
 * GET CART ITEM BY ID
 */
export const getCartItemById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM cart_items
       WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Cart item not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * UPDATE CART ITEM (quantity only)
 */
export const updateCartItem = async (id, updates) => {
  try {
    const allowedFields = ["quantity"];

    const keys = Object.keys(updates).filter((key) =>
      allowedFields.includes(key),
    );

    if (keys.length === 0) {
      throw new Error("No valid fields provided for update");
    }

    if (updates.quantity && updates.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = keys.map((key) => updates[key]);

    values.push(id);

    const query = `
      UPDATE cart_items
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1}
      RETURNING id, cart_id, product_price_id, quantity, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Cart item not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * REMOVE ITEM FROM CART
 */
export const deleteCartItem = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM cart_items
       WHERE id = $1
       RETURNING id, cart_id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Cart item not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * CLEAR CART (remove all items)
 */
export const clearCart = async (cart_id) => {
  try {
    await pool.query(
      `DELETE FROM cart_items
       WHERE cart_id = $1`,
      [cart_id],
    );

    return { message: "Cart cleared" };
  } catch (e) {
    console.error(e);
    throw e;
  }
};
