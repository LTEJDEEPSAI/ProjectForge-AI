const fs = require('fs');
let content = fs.readFileSync('src/__tests__/integration.test.tsx', 'utf8');

content = content.replace(`
      render(<BrowserRouter><ImproveProject /></BrowserRouter>);
      const btn = screen.getByText(/Analyze Project/i);
      fireEvent.click(btn);
      
      expect(api.fetchApi).not.toHaveBeenCalled();`, `
      vi.spyOn(api, 'fetchApi');
      render(<BrowserRouter><ImproveProject /></BrowserRouter>);
      const btn = screen.getByText(/Analyze Project/i);
      fireEvent.click(btn);
      
      expect(api.fetchApi).not.toHaveBeenCalled();`);

fs.writeFileSync('src/__tests__/integration.test.tsx', content);
