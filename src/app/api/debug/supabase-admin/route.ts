import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  getSupabaseAdminEnvDiagnostics,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const expectedToken = process.env.DEBUG_WEBHOOK_TOKEN;

  if (!expectedToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "DEBUG_WEBHOOK_TOKEN is not configured" },
        { status: 404 }
      ),
    };
  }

  const providedToken =
    req.headers.get("x-debug-token") ?? req.nextUrl.searchParams.get("token");

  if (providedToken !== expectedToken) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true as const };
}

export async function GET(req: NextRequest) {
  const auth = isAuthorized(req);
  if (!auth.ok) return auth.response;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, payment_status, status")
      .limit(1);

    return NextResponse.json({
      ok: !error,
      env: getSupabaseAdminEnvDiagnostics(),
      readCheck: {
        ok: !error,
        error,
        sampleRowCount: data?.length ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        env: getSupabaseAdminEnvDiagnostics(),
        error: err.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = isAuthorized(req);
  if (!auth.ok) return auth.response;

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, payment_status, status")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        {
          ok: false,
          env: getSupabaseAdminEnvDiagnostics(),
          fetchError,
        },
        { status: 404 }
      );
    }

    const noOpPayload = {
      payment_status: order.payment_status,
      status: order.status,
    };

    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("orders")
      .update(noOpPayload)
      .select("id, payment_status, status")
      .eq("id", orderId);

    return NextResponse.json(
      {
        ok: !updateError,
        env: getSupabaseAdminEnvDiagnostics(),
        orderBefore: order,
        noOpPayload,
        updateResult: {
          updatedRows,
          updatedCount: updatedRows?.length ?? 0,
          error: updateError,
        },
      },
      { status: updateError ? 500 : 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        env: getSupabaseAdminEnvDiagnostics(),
        error: err.message,
      },
      { status: 500 }
    );
  }
}
