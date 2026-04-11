"use server";

import pool from "@/lib/db";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * CREATE CUSTOMER
 */
export const createCustomer = async ({
  username,
  first_name,
  last_name,
  pin,
  tg_id,
}) => {
  try {
    const hashedPin = pin ? await bcrypt.hash(pin, SALT_ROUNDS) : null;

    const result = await pool.query(
      `INSERT INTO customers 
        (username, first_name, last_name, access_pin_hash, tg_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, first_name, last_name, tg_id, created_at, updated_at`,
      [username, first_name, last_name, hashedPin, tg_id],
    );

    return result.rows[0];
  } catch (e) {
    if (e.code === "23505") {
      if (e.constraint.includes("username")) {
        throw new Error("Username already exists");
      }
      if (e.constraint.includes("tg_id")) {
        throw new Error("Telegram ID already exists");
      }
    }

    console.error(e);
    throw e;
  }
};

/**
 * GET ALL CUSTOMERS
 */
export const getAllCustomers = async () => {
  try {
    const result = await pool.query(
      `SELECT id, username, first_name, last_name, tg_id, created_at, updated_at
       FROM customers`,
    );

    return result.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET CUSTOMER BY ID
 */
export const getCustomerById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, username, first_name, last_name, tg_id, created_at, updated_at
       FROM customers
       WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Customer not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET CUSTOMER BY USERNAME
 */
export const getCustomerByUsername = async (username) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM customers
       WHERE username = $1`,
      [username],
    );

    return result.rows[0] || null;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * GET CUSTOMER BY TG ID (IMPORTANT FOR TELEGRAM)
 */
export const getCustomerByTgId = async (tg_id) => {
  try {
    const result = await pool.query(
      `SELECT id, username, first_name, last_name, tg_id, created_at, updated_at
       FROM customers
       WHERE tg_id = $1`,
      [tg_id],
    );

    return result.rows[0] || null;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * UPDATE CUSTOMER (dynamic)
 */
export const updateCustomer = async (id, updates) => {
  try {
    const allowedFields = [
      "username",
      "first_name",
      "last_name",
      "access_pin_hash",
      "tg_id",
    ];

    const keys = Object.keys(updates).filter((key) =>
      allowedFields.includes(key),
    );

    if (keys.length === 0) {
      throw new Error("No valid fields provided for update");
    }

    // Hash PIN if updating
    if (updates.access_pin_hash) {
      updates.access_pin_hash = await bcrypt.hash(
        updates.access_pin_hash,
        SALT_ROUNDS,
      );
    }

    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = keys.map((key) => updates[key]);
    values.push(id);

    const query = `
      UPDATE customers
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1}
      RETURNING id, username, first_name, last_name, tg_id, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Customer not found");
    }

    return result.rows[0];
  } catch (e) {
    if (e.code === "23505") {
      if (e.constraint.includes("username")) {
        throw new Error("Username already exists");
      }
      if (e.constraint.includes("tg_id")) {
        throw new Error("Telegram ID already exists");
      }
    }

    console.error(e);
    throw e;
  }
};

/**
 * DELETE CUSTOMER
 */
export const deleteCustomer = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM customers
       WHERE id = $1
       RETURNING id, username, tg_id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Customer not found");
    }

    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};
