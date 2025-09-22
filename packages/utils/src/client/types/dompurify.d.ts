declare module 'dompurify' {
  const DOMPurify: {
    sanitize: (input: string, config?: any) => any;
  };
  export default DOMPurify;
}
