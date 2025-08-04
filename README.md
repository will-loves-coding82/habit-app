![dashboard preview](/public/readme-preview.png)

## Features
* User Auth with Supabase
* Create, Edit, and Delete habits with Supabase PostgreSQL 
* Daily cron jobs that duplicate your habits each day and track your streaks
* Essential statistics in a personal dashboard to track your progress
* Chat GPT LLM Assistant via Edge Functions
  * Built with 4.0 mini and AI Tooling to fetch user's data based on NLP queries
* Profile page with avatar photo customization

## Project Structure
* /app: Entrypoint to the home page
* /hooks: Reusable logic to manage complex state operations
* /context: Centralizes and manages state for downstream client components
* /dashboard: 
  * /profile: User profile management
  * /actions: Server actions for creating new habits
* /auth: Routes for user authentication
* /lib
  * /supabase: Contains supabase client initializers and middleware
  * /functions: Helper methods to use across the app
* /components: Custom UI components


## Tools
* TypeScript
* React Chart JS
* Tailwind CSS
* Hero UI Library


## Demo
You can view a fully working demo at [stacked-habots.vercel.app](https://stacked-habits.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[  ![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).




## Clone and run locally
1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)
2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```
3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```
4. Rename `.env.example` to `.env.local` and update the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
   ```

   Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)
5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).
6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.
