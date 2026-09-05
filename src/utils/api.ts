export async function fetchApi(url: string, options?: RequestInit) {
    // Inject selected model if body is JSON
  let modifiedOptions = { ...options };
  if (modifiedOptions?.body && typeof modifiedOptions.body === 'string') {
    try {
      const parsed = JSON.parse(modifiedOptions.body);
      const selectedModel = localStorage.getItem('selectedModel') || 'gpt-4o-mini';
      parsed.model = selectedModel;
      modifiedOptions.body = JSON.stringify(parsed);
    } catch(e) {}
  }
  const res = await fetch(url, {
    ...modifiedOptions,
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
    throw new Error(data.error?.message || data.error || data.message || `API Error: ${res.status} ${res.statusText}`);
  }

  return data;
}
