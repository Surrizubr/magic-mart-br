import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { images } = await req.json();
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const imageContent = images.map((img: string) => ({
      type: "image_url" as const,
      image_url: { url: img },
    }));

    const systemPrompt = `Você é um especialista em leitura de cupons fiscais brasileiros (NF-e / cupom fiscal de supermercado).
Analise a(s) imagem(ns) do cupom fiscal e extraia TODAS as informações com máxima precisão.

Retorne os dados usando a função extract_receipt_data.

Regras:
- Extraia TODOS os itens listados, sem pular nenhum.
- Para cada item: nome do produto, quantidade, unidade (un, kg, lt, etc.), preço unitário e preço total ORIGINAL (antes de descontos).
- Identifique o nome do estabelecimento (loja/mercado).
- Identifique o endereço do estabelecimento se visível.
- Identifique a data da compra no formato YYYY-MM-DD.
- Identifique o valor TOTAL do cupom (geralmente no final, após "TOTAL" ou "VALOR TOTAL").
- Calcule a soma de todos os itens e compare com o total do cupom.
- Se houver desconto, troco, ou taxa, identifique-os separadamente.
- DESCONTOS: No cupom fiscal, descontos geralmente aparecem na linha LOGO ABAIXO do item que recebeu o desconto.
  Aplique o desconto SOMENTE no item específico que o recebeu, NÃO distribua proporcionalmente entre todos os itens.
  Use o campo "discount_amount" do item para informar o valor do desconto aplicado naquele item específico.
  O "discounted_price" de cada item deve ser: total_price - discount_amount.
  Itens sem desconto devem ter discount_amount = 0 e discounted_price = total_price.
  O campo "discount" no nível raiz deve conter a soma de todos os descontos individuais.
- Categorize cada item: Grãos, Laticínios, Carnes, Frutas, Verduras, Bebidas, Padaria, Limpeza, Higiene, Temperos, Frios, Congelados, Alimentos, Transporte, ou Outros.
- A categoria "Transporte" inclui: combustível (gasolina, etanol, diesel, GNV), pedágios, estacionamento, lavagem de carro, manutenção veicular (óleo, pneus, filtros, peças), transporte escolar (perua/van escolar), táxi, Uber, 99, corridas de app, passagens de ônibus/metrô/trem, recarga de bilhete de transporte, e qualquer outro gasto relacionado a deslocamento ou veículos.

REGRA CRÍTICA PARA MÚLTIPLAS FOTOS:
Quando múltiplas imagens forem enviadas, elas são partes SEQUENCIAIS do MESMO cupom fiscal longo.
O usuário foi instruído a fotografar de modo que o ÚLTIMO item visível em uma foto apareça TAMBÉM no INÍCIO da próxima foto, criando uma zona de sobreposição/interseção.
Você DEVE:
1. Identificar os itens de sobreposição comparando nomes de produtos, quantidades e preços entre o final de uma imagem e o início da próxima.
2. REMOVER as duplicatas — incluir cada item apenas UMA VEZ na lista final.
3. Usar a ordem sequencial das imagens para montar a lista completa de itens na ordem correta do cupom.
4. Se não encontrar sobreposição clara entre duas fotos consecutivas, inclua todos os itens de ambas mas adicione uma nota no campo "notes" indicando que a sobreposição não foi identificada e pode haver duplicatas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise este cupom fiscal e extraia todos os dados." },
              ...imageContent,
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt_data",
              description: "Extrair dados estruturados de um cupom fiscal brasileiro",
              parameters: {
                type: "object",
                properties: {
                  store_name: { type: "string", description: "Nome do estabelecimento" },
                  store_address: { type: "string", description: "Endereço do estabelecimento, se visível" },
                  date: { type: "string", description: "Data da compra no formato YYYY-MM-DD" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        product_name: { type: "string" },
                        quantity: { type: "number" },
                        unit: { type: "string", enum: ["un", "kg", "lt", "l", "ml", "g", "pc", "pct", "cx", "dz", "mt", "m"] },
                        unit_price: { type: "number" },
                        total_price: { type: "number", description: "Preço total original (antes do desconto)" },
                        discount_amount: { type: "number", description: "Valor de desconto aplicado neste item (0 se não houver)" },
                        discounted_price: { type: "number", description: "Preço final após desconto (total_price - discount_amount)" },
                        category: {
                          type: "string",
                          enum: ["Grãos", "Laticínios", "Carnes", "Frutas", "Verduras", "Bebidas", "Padaria", "Limpeza", "Higiene", "Temperos", "Frios", "Congelados", "Alimentos", "Transporte", "Outros"],
                        },
                      },
                      required: ["product_name", "quantity", "unit", "unit_price", "total_price", "discount_amount", "discounted_price", "category"],
                    },
                  },
                  receipt_total: { type: "number", description: "Valor total impresso no cupom" },
                  items_sum: { type: "number", description: "Soma calculada de todos os itens" },
                  discount: { type: "number", description: "Desconto aplicado, se houver" },
                  difference: { type: "number", description: "Diferença entre total do cupom e soma dos itens (0 se iguais)" },
                  notes: { type: "string", description: "Observações sobre discrepâncias ou itens difíceis de ler" },
                },
                required: ["store_name", "date", "items", "receipt_total", "items_sum", "difference"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt_data" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para análise de IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro na análise de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "IA não retornou dados estruturados" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const receiptData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(receiptData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-receipt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
