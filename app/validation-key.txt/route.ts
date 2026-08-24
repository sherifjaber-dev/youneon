const VALIDATION_KEY = "5d7e6e7715b27227ab027711c994fe6a002210ff";

export async function GET() {
  return new Response(`${VALIDATION_KEY}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0, must-revalidate",
    },
  });
}
