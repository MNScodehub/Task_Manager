import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { taskTitle } = await req.json();

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: "Task title is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const systemPrompt = `You are a helpful assistant that breaks down big tasks into simple, clear subtasks. Given a main task title, return a list of 5 to 7 clear, short subtasks needed to complete it. The subtasks should be practical and written in plain language. Return them as a plain JSON array. Do not include any extra text or explanations.
Main task: "Plan a wedding"
Example output:
[
  "Book wedding venue",
  "Hire photographer",
  "Send invitations",
  "Arrange catering",
  "Plan wedding ceremony",
  "Choose wedding dress",
  "Plan honeymoon"
]
Now generate subtasks for this task:
"${taskTitle}"`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: taskTitle,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate subtasks" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await openaiResponse.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    let subtasks: string[];
    try {
      subtasks = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse OpenAI response:", content);
      subtasks = [];
    }

    return new Response(
      JSON.stringify({ subtasks }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-subtasks function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});