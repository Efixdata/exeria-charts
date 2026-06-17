const FORM_NAME = "exeria-contact";

export function encodeNetlifyFormBody(data: Record<string, string>): string {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key] ?? "")}`)
    .join("&");
}

export async function submitNetlifyForm(data: Record<string, string>): Promise<void> {
  const body = encodeNetlifyFormBody({
    "form-name": FORM_NAME,
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
