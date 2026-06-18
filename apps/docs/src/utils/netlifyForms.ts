export const NETLIFY_FORMS = {
  CONTACT: "exeria-contact",
  CONNECTOR_REQUEST: "connector-request",
} as const;

export type NetlifyFormName = typeof NETLIFY_FORMS[keyof typeof NETLIFY_FORMS];

export function encodeNetlifyFormBody(data: Record<string, string>): string {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key] ?? "")}`)
    .join("&");
}

export async function submitNetlifyForm(formName: NetlifyFormName, data: Record<string, string>): Promise<void> {
  const body = encodeNetlifyFormBody({
    "form-name": formName,
    ...data,
  });

  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Form submission failed (${response.status})`);
  }
}
