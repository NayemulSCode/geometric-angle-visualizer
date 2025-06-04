# Deploying to Vercel

This guide provides step-by-step instructions to deploy the Interactive Geometry Explorer application to Vercel.

**1. Prerequisites:**

*   Ensure you have a Vercel account. If not, sign up at [https://vercel.com/signup](https://vercel.com/signup).
*   Ensure your project code is pushed to a Git repository (e.g., GitHub, GitLab, Bitbucket). Vercel uses these repositories to import and build your project.

**2. Importing Project to Vercel:**

1.  Log in to your Vercel dashboard.
2.  Click on the "Add New..." button and select "Project".
3.  Connect your Git provider (e.g., GitHub). You may need to authorize Vercel to access your repositories.
4.  Select the repository for this project (e.g., `interactive-geometry-explorer`).
5.  Vercel will typically auto-detect that this is a Vite project.

**3. Configure Project (If Necessary):**

Vercel is usually very good at auto-detecting settings for Vite projects. However, it's good to verify them.

*   **Framework Preset:** This should be automatically set to "Vite". If for some reason it's not, you can select "Vite" from the list.
*   **Build Command:**
    *   Vercel should automatically use `vite build`.
    *   The `package.json` has `"build": "tsc -b && vite build"`. Vercel will respect this and run the full command.
    *   You can usually leave this as detected, or override it to `npm run build` if needed.
*   **Output Directory:**
    *   This should be automatically set to `dist` (the standard output directory for Vite projects).
    *   Verify this is correct.
*   **Install Command:**
    *   This should be `npm install` (or `yarn install` if you used Yarn). Vercel typically handles this correctly based on your project's lock files.
*   **Environment Variables:**
    *   No specific environment variables are required for this project to run at the moment.

**4. Deploy:**

1.  Once you've reviewed the settings, click the "Deploy" button.
2.  Vercel will start the build process (installing dependencies, running `tsc -b && vite build`) and then deploy the contents of the `dist` directory.
3.  You can monitor the build logs in your Vercel dashboard.

**5. Access Your Deployed Site:**

*   Once the deployment is complete (it usually takes a few minutes), Vercel will provide you with one or more URLs to access your live application (e.g., `your-project-name.vercel.app`).
*   Visit this URL in your browser to see your deployed Interactive Geometry Explorer!

**Troubleshooting:**

*   If the build fails, check the build logs on Vercel for any error messages. These often point to missing dependencies or build command issues.
*   Ensure your local development environment builds successfully (`npm run build`) before deploying.
*   Double-check that all necessary files are committed to your Git repository.
