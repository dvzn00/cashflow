import { NextResponse } from "next/server";

/**
 * Monthly statement export. Implemented in Bloco 4 with @react-pdf/renderer.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Exportação de PDF ainda não implementada (Bloco 4)." },
    { status: 501 },
  );
}
