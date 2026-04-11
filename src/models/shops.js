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
 * DELETE SHOP
 */
export const deleteShop = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM shops
       WHERE id = $1
       RETURNING id, name`,
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
