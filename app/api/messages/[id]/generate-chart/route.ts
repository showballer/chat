import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 查询 message 获取 queryResult
    const message = await prisma.message.findUnique({
      where: { id },
      select: {
        id: true,
        queryResult: true,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (!message.queryResult) {
      return NextResponse.json(
        { error: "No query result available for this message" },
        { status: 400 }
      );
    }

    // 2. 调用模型侧图表生成接口
    const modelResponse = await fetch(
      `${process.env.MODEL_API_URL}/generate-chart`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query_result: message.queryResult,
        }),
      }
    );

    if (!modelResponse.ok) {
      const errorText = await modelResponse.text();
      console.error("Model API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate chart from model API" },
        { status: 500 }
      );
    }

    const chartData = await modelResponse.json();

    // 3. 保存图表数据到数据库
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        chartData: chartData,
      },
    });

    // 4. 返回图表数据
    return NextResponse.json({
      success: true,
      chartData: chartData,
    });
  } catch (error) {
    console.error("Generate chart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
