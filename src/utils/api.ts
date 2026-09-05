export async function fetchApi(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error('Non-JSON response:', text.substring(0, 200));
    throw new Error(`Server returned unexpected format (${res.status} ${res.statusText}). The deployment environment might not be running the API correctly.`);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || `API Error: ${res.status} ${res.statusText}`);
  }

  return data;
}
