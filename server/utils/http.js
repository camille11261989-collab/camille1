const defaultHeaders = {
  "Content-Type": "application/json; charset=utf-8"
};

export function sendJson(res, status, body, headers = {}) {
  res.statusCode = status;
  Object.entries({ ...defaultHeaders, ...headers }).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.end(JSON.stringify(body));
}

export function methodNotAllowed(res) {
  sendJson(res, 405, { error: "Method Not Allowed" });
}

export function analyticsNotConnected(res, message = "數據尚未連接", options = {}) {
  sendJson(
    res,
    200,
    {
      connected: false,
      status: options.status || "not_connected",
      message,
      missing: options.missing || [],
      details: options.details || "",
      updatedAt: new Date().toISOString()
    },
    { "Cache-Control": "no-store" }
  );
}
