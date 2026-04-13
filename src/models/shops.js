"use server";

import pool from "@/lib/db";

/**
 * CREATE SHOP
 */
export const createShop = async (vendor_id, data) => {
  try {
    const { name, description, banner_url } = data;

    const result = await pool.query(
      `INSERT INTO shops (vendor_id, name, description, banner_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, vendor_id, name, description, banner_url, created_at, updated_at`,
      [vendor_id, name, description || null, banner_url || null],
    );

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET ALL SHOPS
 */
export const getAllShops = async () => {
  try {
    const result = await pool.query(
      `SELECT id, vendor_id, name, description, banner_url, created_at, updated_at
       FROM shops`,
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET SHOP BY ID
 */
export const getShopById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, vendor_id, name, description, banner_url, created_at, updated_at
       FROM shops
       WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Shop not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET SHOPS BY VENDOR
 */
export const getShopsByVendor = async (vendor_id) => {
  try {
    const result = await pool.query(
      `SELECT id, vendor_id, name, description, banner_url, created_at, updated_at
       FROM shops
       WHERE vendor_id = $1`,
      [vendor_id],
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * UPDATE SHOP (dynamic)
 */
export const updateShop = async (id, updates) => {
  try {
    const allowedFields = ["name", "description", "banner_url"];

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
      UPDATE shops
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1}
      RETURNING id, vendor_id, name, description, banner_url, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Shop not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * DELETE SHOP (Comprehensive deletion of all related data and the vendor)
 */
export const deleteShop = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get vendor_id before deleting anything
    const shopRes = await client.query(
      `SELECT vendor_id, name FROM shops WHERE id = $1`,
      [id],
    );

    if (shopRes.rows.length === 0) {
      throw new Error("Shop not found");
    }

    const { vendor_id, name } = shopRes.rows[0];

    // 2. Delete Order Items (linked via orders)
    await client.query(
      `DELETE FROM order_items 
       WHERE order_id IN (SELECT id FROM orders WHERE shop_id = $1)`,
      [id],
    );

    // 3. Delete Orders
    await client.query(`DELETE FROM orders WHERE shop_id = $1`, [id]);

    // 4. Delete Cart Items (linked via carts)
    await client.query(
      `DELETE FROM cart_items 
       WHERE cart_id IN (SELECT id FROM carts WHERE shop_id = $1)`,
      [id],
    );

    // 5. Delete Carts
    await client.query(`DELETE FROM carts WHERE shop_id = $1`, [id]);

    // 6. Delete Cart Items (linked via product_prices)
    // (This ensures no orphan cart items exist if they were linked directly to prices)
    await client.query(
      `DELETE FROM cart_items 
       WHERE product_price_id IN (
         SELECT pp.id FROM product_prices pp 
         JOIN products p ON pp.product_id = p.id 
         WHERE p.shop_id = $1
       )`,
      [id],
    );

    // 7. Delete Product Prices
    await client.query(
      `DELETE FROM product_prices 
       WHERE product_id IN (SELECT id FROM products WHERE shop_id = $1)`,
      [id],
    );

    // 8. Delete Products
    await client.query(`DELETE FROM products WHERE shop_id = $1`, [id]);

    // 9. Delete Shop
    await client.query(`DELETE FROM shops WHERE id = $1`, [id]);

    // 10. Delete Vendor
    if (vendor_id) {
      await client.query(`DELETE FROM vendors WHERE id = $1`, [vendor_id]);
    }

    await client.query("COMMIT");

    return { id, name, vendor_id };
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error in deleteShop transaction:", e);
    throw e;
  } finally {
    client.release();
  }
};
