import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.warn("[Resend] AVISO: RESEND_API_KEY no está configurada en las variables de entorno.");
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface SendOtpParams {
  email: string;
  code: string;
  name?: string | undefined;
}

export async function sendOtpVerificationEmail({ email, code, name }: SendOtpParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();

  if (!resend) {
    console.log(`[Resend Simulación / Dev] Código OTP para ${email}: ${code}`);
    return { success: true, id: "simulated-no-resend-key" };
  }

  const fromAddress = process.env["EMAIL_FROM"] || "Andamiarte <contacto@andamiarte.com.ar>";
  const displayName = name ? name.trim() : email.split("@")[0];

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu código de verificación de Andamiarte</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fbf5ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fbf5ee; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e8dfd5; padding: 36px 28px; box-shadow: 0 4px 16px rgba(29, 61, 41, 0.04); text-align: left;">
          <!-- Marca / Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #f1eae2;">
              <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #e8f3ec; color: #1d3d29; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
                Red de Inclusión Escolar
              </span>
              <h1 style="margin: 6px 0 0 0; font-size: 26px; font-weight: 800; color: #1d3d29; letter-spacing: -0.5px;">
                ANDAMIARTE
              </h1>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding-top: 28px; padding-bottom: 12px;">
              <h2 style="margin: 0 0 12px 0; font-size: 19px; font-weight: 700; color: #1d3d29;">
                ¡Hola, ${displayName}!
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a5568;">
                Gracias por sumarte a <strong>Andamiarte</strong>. Para validar tu dirección de correo electrónico y activar de forma segura tu cuenta, ingresá este código de 6 dígitos en la pantalla de verificación:
              </p>
            </td>
          </tr>

          <!-- Bloque OTP -->
          <tr>
            <td align="center" style="padding: 16px 0 24px 0;">
              <div style="background-color: #e8f3ec; border: 1px solid #cbe4d4; border-radius: 16px; padding: 20px 24px; display: inline-block; width: 100%; box-sizing: border-box; text-align: center;">
                <span style="font-family: 'Courier New', Courier, monospace, 'Lucida Console'; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1d3d29; display: block; line-height: 1.1;">
                  ${code}
                </span>
              </div>
            </td>
          </tr>

          <!-- Expiración y Seguridad -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.5; color: #718096; text-align: center;">
                ⏱️ Este código expira en <strong>10 minutos</strong> y es de un único uso.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #a0aec0; text-align: center;">
                Si vos no solicitaste registrarte en Andamiarte, podés ignorar este correo; tu casilla no sufrirá ninguna modificación.
              </p>
            </td>
          </tr>

          <!-- Pie del Correo -->
          <tr>
            <td style="border-top: 1px solid #f1eae2; padding-top: 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #a0aec0;">
                © 2026 Andamiarte · República Argentina<br>
                Construyendo inclusión escolar en equipo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: "Tu código de verificación de Andamiarte",
      html,
    });

    if (error) {
      console.error("[Resend] Error al enviar email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("[Resend] Excepción al despachar correo:", err);
    return { success: false, error: err?.message || "Error al enviar el correo" };
  }
}
