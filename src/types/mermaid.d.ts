declare module 'mermaid' {
  const mermaid: {
    initialize: (config: any) => void;
    render: (id: string, code: string) => Promise<{ svg: string }>;
    run: (options?: any) => Promise<void>;
  };
  export default mermaid;
}
