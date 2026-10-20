export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      customer_name,
      phone,
      address,
      product_name,
      color,
      size,
      quantity
    } = req.body || {};

    if (
      typeof customer_name !== "string" ||
      typeof phone !== "string" ||
      typeof address !== "string" ||
      typeof product_name !== "string" ||
      typeof color !== "string" ||
      typeof size !== "string" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 5
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid order details"
      });
    }

    if (
      customer_name.trim().length < 2 ||
      phone.trim().length < 7 ||
      phone.trim().length > 30 ||
      address.trim().length < 5 ||
      customer_name.trim().length > 100 ||
      address.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        error: "Please check your customer details"
      });
    }

    // Only the currently approved product is available to purchase.
    if (
      product_name !== "H/77 Essential Hoodie" ||
      color !== "Charcoal" ||
      !["M", "L", "XL", "2XL"].includes(size)
    ) {
      return res.status(400).json({
        success: false,
        error: "Product, color, or size is unavailable"
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase server configuration.");

      return res.status(500).json({
        success: false,
        error: "Server configuration is incomplete"
      });
    }

    const response = await fetch(
      `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/create_h77_order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          p_customer_name: customer_name.trim(),
          p_phone: phone.trim(),
          p_address: address.trim(),
          p_product_name: product_name,
          p_color: color,
          p_size: size,
          p_quantity: quantity
        })
      }
    );

    let result = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok) {
      console.error(
        "Supabase order request failed:",
        response.status
      );

      return res.status(502).json({
        success: false,
        error: "Could not save the order"
      });
    }

    if (
      !result ||
      result.success !== true ||
      !result.order_id
    ) {
      console.error("Supabase returned no valid order confirmation.");

      return res.status(502).json({
        success: false,
        error: "Order confirmation failed"
      });
    }

    return res.status(201).json({
      success: true,
      order_id: result.order_id
    });

  } catch (error) {
    console.error("Order API error:", error.message);

    return res.status(500).json({
      success: false,
      error: "An unexpected server error occurred"
    });
  }
}
