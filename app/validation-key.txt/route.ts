const VALIDATION_KEY = "54d0e8bd2826d4e841d24b99234855aa6a0a1bcafbc6552a03480e6dc64717ecf6f86ff5679a83489e170c62";

export async function GET() {
  return new Response(`${VALIDATION_KEY}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0, must-revalidate",
    },
  });
}
