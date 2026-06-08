const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

function crearClienteMercadoPago() {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("Falta MP_ACCESS_TOKEN en variables de entorno.");
  }

  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
  });
}

function crearPreferenceClient() {
  const client = crearClienteMercadoPago();
  return new Preference(client);
}

function crearPaymentClient() {
  const client = crearClienteMercadoPago();
  return new Payment(client);
}

module.exports = {
  crearPreferenceClient,
  crearPaymentClient,
};