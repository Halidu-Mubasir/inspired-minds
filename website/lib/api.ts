const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** POSTs a public form submission to the LMS backend. Throws if it was not accepted. */
export async function submitForm(path: string, data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(res.status === 429 ? "Too many submissions" : `Submission failed (${res.status})`);
  }
}
