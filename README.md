 ![hero preview](/public/readme/hero.png)
 ![dashboard preview](/public/readme/dashboard.png)
 ![schema preview](/public/readme/schema.png)

## Features

* User Auth with Supabase
* Create, Edit, and Delete habits with Supabase PostgreSQL
* Essential statistics in a personal dashboard to track your progress
* Chat GPT LLM Assistant via Edge Functions
  * Built with 4.1 mini and AI Tooling to fetch user's data based on natural language queries
* Profile page with avatar photo customization

## Project Structure

* /app: Entrypoint to the home page
* /queries: Reusable tanstack query options and mutation functions that are used in client components
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
* [Tanstack Query](https://tanstack.com/query/latest)
* [React Chart JS 2](https://react-chartjs-2.js.org)
* [Tailwind CSS](https://tailwindcss.com)
* [Hero UI Library](https://www.heroui.com)
* [Motion Animation](https://motion.dev)
* [Supabase](https://supabase.com)
* [Vercel AI SDK Tooling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#multi-step-calls-using-stopwhen)


## Demo

You can view a fully working demo at [stacked-habits.vercel.app](https://stacked-habits.vercel.app/).


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


