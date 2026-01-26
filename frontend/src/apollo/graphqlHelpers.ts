export function formatGqlError(err: any): string {
  if (!err) return '';
  if (err.graphQLErrors && err.graphQLErrors.length) return err.graphQLErrors.map((e:any)=>e.message).join('; ');
  if (err.message) return err.message;
  return String(err);
}
