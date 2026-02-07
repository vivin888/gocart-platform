import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import imagekit from "@/configs/imagekit"


// create the store
export async function POST(request) {
  try {
        const { userId } = getAuth(request)
        if (!userId) {
             return new NextResponse("Unauthorized", { status: 401 });
        }
        // Get the data from the form
        const formData = await request.formData()

        const name = formData.get("name")
        const username = formData.get("username")
        const description = formData.get("description")
        const email = formData.get("email")
        const contact = formData.get("contact")
        const address = formData.get("address")
        const image = formData.get("image")
        if (
        !name ||
        !username ||
        !description ||
        !email ||
        !contact ||
        !address ||
        !image
            ) {
        return NextResponse.json(
            { error: "missing store info" },
            { status: 400 }
        );
        }

        // check is user have already registered a store
        const store = await prisma.store.findFirst({
        where: { userId: userId }
        });
        // if store is already registered then send status of store
        if (store) {
        return NextResponse.json({ status: store.status });
        }

        // check is username is already taken
        const isUsernameTaken = await prisma.store.findFirst({
        where: { username: username.toLowerCase() }
        })

        if (isUsernameTaken) {
        return NextResponse.json(
            { error: "username already taken" },
            {status: 400 })
        }
        // NSURE USER EXISTS IN DATABASE (FIXES P2003)
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: email,
            name: name,
            image: "https://ui-avatars.com/api/?name=" + encodeURIComponent(name),
          },
        });


        // imagekit upload
        const buffer = Buffer.from(await image.arrayBuffer());
        const response = await imagekit.upload({
                file: buffer,
                fileName:image.name,
                folder: "logos"
        })
        const optimizedImageUrl = imagekit.url({
            path : response.filePath,
            transformation : [ {quality : "auto"}, { format : "webp"},{width : "512"}]
        })

        // create the store
        const newStore = await prisma.store.create({
          data: {
            userId,
            name,
            description,
            username: username.toLowerCase(),email,contact,address,logo : optimizedImageUrl
          }
        })
        //link store to user
        await prisma.user.update({
            where: { id: userId },
            data: { store : { connect: { id: newStore.id } } }
        })

        return NextResponse.json(
          { message: "applied , waiting for approval" }
        )

  } catch (error) {
     return NextResponse.json(
          {error :  error.code || error.message},{ status: 400 }
        )
  }
  
}

// check is user have already registered a store if yes then send status of store

export async function GET(request) {
  try {
    const { userId } = getAuth(request)

    // check is user have already registered a store
    const store = await prisma.store.findFirst({
      where: { userId: userId }
    })

    // if store is already registered then send status of store
    if (store) {
      return NextResponse.json({ status: store.status })
    }
    return NextResponse.json({ status: "not registered" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
        { error: error.code || error.message },
        { status: 400 }
    )
    }
}

