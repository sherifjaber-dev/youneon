const VALIDATION_KEY = "5d7e6e7715b27227ab027711c994fe6a002210ff54d0e8bd2826d4e841d24b99234855aa6a0a1bcafbc6552a03480e6dc64717ecf6f86ff5679a83489e170c62";

export async function GET() {
  return new Response(VALIDATION_KEY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
