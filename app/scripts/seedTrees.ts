import Tree from "@/models/trees"; // Tree model
import connectToDatabase from "@/lib/mongodb"; // your helper

async function main() {
  try {
    await connectToDatabase(); // <-- call it to connect
    console.log("✅ Connected to MongoDB");

    const trees = [
      { type: 1, x: 50, y: 100 },
      { type: 2, x: 150, y: 200 },
      { type: 3, x: 300, y: 400 },
    ];

    await Tree.insertMany(trees);
    console.log("🌳 Trees inserted!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
