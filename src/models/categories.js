"use server";

import pool from "@/lib/db";

/**
 * CREATE CATEGORY
 */
export const createCategory = async (name) => {
  try {
    const result = await pool.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       RETURNING id, name, created_at`,
      [name],
    );

    return result.rows[0];
  } catch (e) {
    // Handle duplicate category name
    if (e.code === "23505") {
      throw new Error("Category already exists");
    }

    console.error(e);
    throw e;
  }
};

/**
 * GET ALL CATEGORIES
 */
export const getAllCategories = async () => {
  try {
    const result = await pool.query(
      `SELECT id, name, created_at
       FROM categories
       ORDER BY name ASC`,
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET CATEGORY BY ID
 */
export const getCategoryById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, name, created_at
       FROM categories
       WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Category not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * UPDATE CATEGORY
 */
export const updateCategory = async (id, updates) => {
  try {
    const allowedFields = ["name"];

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
      UPDATE categories
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING id, name, created_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Category not found");
    }

    return result.rows[0];
  } catch (e) {
    if (e.code === "23505") {
      throw new Error("Category name already exists");
    }

    console.error(e);
    throw e;
  }
};

/**
 * DELETE CATEGORY
 */
export const deleteCategory = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM categories
       WHERE id = $1
       RETURNING id, name`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Category not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};
