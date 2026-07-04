const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const phone = "+94772051949";
  const updatedCustObj = {
    phone,
    name: "tyre kade shop",
    address: "tyree kade, Angoda 10620",
    address_label: null
  };

  console.log("Testing Supabase update with customer->>phone filter...");
  const { data, error } = await supabase
    .from("orders")
    .update({ customer: updatedCustObj })
    .eq("customer->>phone", phone)
    .select();

  if (error) {
    console.error("Error using customer->>phone:", error);
  } else {
    console.log("Success using customer->>phone:", data);
  }

  console.log("Testing Supabase update with customer->phone filter...");
  const { data: data2, error: error2 } = await supabase
    .from("orders")
    .update({ customer: updatedCustObj })
    .eq("customer->phone", phone)
    .select();

  if (error2) {
    console.error("Error using customer->phone:", error2);
  } else {
    console.log("Success using customer->phone:", data2);
  }
}

main().catch(console.error);
