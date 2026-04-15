# Mercado Pago Credentials - Configuration Guide

## Source: Fifia Doces (Production)

The following Mercado Pago credentials are being used from the **Fifia Doces** production environment and should be applied to the **Dropshipping** services.

---

## Credentials

```bash
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-5757208975792883-032017-204a58f666b5974f8a0a210a89695af5-281559812
MERCADO_PAGO_PUBLIC_KEY=APP_USR-504b4846-b7b2-4a4f-a300-87b244cf09ca
MERCADO_PAGO_WEBHOOK_SECRET=db567f0a77f15ad9f5e50512a5d1a74f6d864b9254a2e16ae9952c0c282f24b7
```

---

## Applications to Update

### 1. dropshipping-service (Backend)
**Application ID:** `b297O2GbhkQfE94iIGdai`
**Current Status:** Missing Mercado Pago credentials

**Environment Variables to Add:**
```bash
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-5757208975792883-032017-204a58f666b5974f8a0a210a89695af5-281559812
MERCADO_PAGO_WEBHOOK_SECRET=db567f0a77f15ad9f5e50512a5d1a74f6d864b9254a2e16ae9952c0c282f24b7
STOREFRONT_BASE_URL=https://portal.gaqno.com.br/dropshipping
TENANT_NAME=Gaqno Dropshipping
```

### 2. dropshipping-ui (Frontend)
**Application ID:** `pWCPRH4MiDSCY1j8OjkXt`
**Current Status:** Needs public key

**Environment Variables to Add:**
```bash
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=APP_USR-504b4846-b7b2-4a4f-a300-87b244cf09ca
```

---

## How to Update in Dokploy UI

1. Navigate to **Projects** → **gaqno-production**
2. Select the application:
   - For backend: `dropshipping-service`
   - For frontend: `dropshipping-ui`
3. Click on **Environment** tab
4. Add/update the environment variables listed above
5. Click **Deploy** to apply changes

---

## Webhook Configuration

**Webhook URL:** `https://api.gaqno.com.br/dropshipping/api/webhooks/mercadopago`

Configure this webhook in your Mercado Pago dashboard:
1. Go to https://www.mercadopago.com.br/developers
2. Navigate to your application
3. Add webhook URL for payment notifications
4. Secret: `db567f0a77f15ad9f5e50512a5d1a74f6d864b9254a2e16ae9952c0c282f24b7`

---

## Security Notes

⚠️ **IMPORTANT:** These are production credentials. Keep them secure and:
- Never commit them to git repositories
- Only share with authorized personnel
- Rotate periodically for security
- Monitor for unauthorized usage

---

## Verification

After updating the credentials, verify the integration by:
1. Creating a test order
2. Initiating a PIX payment
3. Checking if the webhook receives notifications
4. Verifying payment status updates

---

*Document generated: 2025-01-13*
