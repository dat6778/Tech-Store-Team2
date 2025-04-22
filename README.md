<p align="center">
  <a href="https://www.medusajs.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
      <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">Tech-Store-Team2</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> | 
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  A tech store project built with MedusaJS, targeting the Vietnamese market with VND as the currency.
</p>

<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
  <a href="https://www.producthunt.com/posts/medusa">
    <img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt">
  </a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

## Compatibility

This project is compatible with versions >= 2 of `@medusajs/medusa`.

## What is Medusa?

Medusa is a set of commerce modules and tools that allow you to build rich, reliable, and performant commerce applications without reinventing core commerce logic. The modules can be customized and used to build advanced ecommerce stores, marketplaces, or any product that needs foundational commerce primitives. All modules are open-source and freely available on npm.

Learn more about [Medusa’s architecture](https://docs.medusajs.com/learn/introduction/architecture) and [commerce modules](https://docs.medusajs.com/learn/fundamentals/modules/commerce-modules) in the [Docs](https://docs.medusajs.com).

## Project Overview

**Tech-Store-Team2** is a tech store project built with MedusaJS, targeting the Vietnamese market with VND as the currency. It includes a backend powered by MedusaJS for managing products and orders, and a storefront built with Next.js for displaying the store.

### Project Structure

- **backend-admin**: MedusaJS backend, containing seed data (tech products: MacBook, iPhone, etc.).
- **my-medusa-store-storefront**: Storefront (Next.js) for displaying products.

### Requirements

- **Node.js**: v18 or higher.
- **PostgreSQL**: Must support UTF-8 encoding.
- **Redis**: Used for session and cache management.
- **Yarn**: For dependency management.

## Guide to Download and Run the Project

### 1. Clone the Repository

Clone the project from GitHub to your local machine:

```bash
git clone https://github.com/dat6778/Tech-Store-Team2.git
cd Tech-Store-Team2
```

### 2. Set Up and Run the Backend (backend-admin)

The backend uses MedusaJS to manage the store.

#### a. Install Dependencies

```bash
cd backend-admin
yarn install
```

#### b. Configure Environment Variables

- Copy the `.env.template` file to `.env`:

  ```bash
  cp .env.template .env
  ```

- Open the `.env` file and update the following values:

  ```
  DATABASE_URL=postgres://username:password@localhost:5432/tech_store_db
  REDIS_URL=redis://localhost:6379
  STORE_CORS=https://your-storefront.vercel.app,http://localhost:3000
  ```

  - `DATABASE_URL`: URL to connect to your PostgreSQL database (replace `username`, `password`, and `tech_store_db` with your details).
  - `REDIS_URL`: URL to connect to your Redis instance.
  - `STORE_CORS`: Ensure it includes the storefront URLs (both local and deployed).

#### c. Run Migrations and Seed Data

- Run migrations to set up the database schema:

  ```bash
  npx medusa db:migrate
  ```

- Seed sample data (products, regions, etc.):

  ```bash
  npx medusa seed
  ```

  - The seed data will include:
    - Region: `Vietnam`, currency `VND`.
    - Products: MacBook Pro (45,000,000 VND), iPhone 14 Pro (25,000,000 VND), etc.

#### d. Start the Backend

```bash
npx medusa develop
```

- The backend will run at `http://localhost:9000`.
- Access the Admin Panel at `http://localhost:7000` to manage products, orders, etc.

### 3. Set Up and Run the Storefront (my-medusa-store-storefront)

The storefront uses Next.js to display the store.

#### a. Install Dependencies

```bash
cd ../my-medusa-store-storefront
yarn install
```

#### b. Configure Environment Variables

- Copy the `.env.local.example` file to `.env.local`:

  ```bash
  cp .env.local.example .env.local
  ```

- Open the `.env.local` file and update the following values:

  ```
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_publishable_key
  NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
  ```

  - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`: Obtain this from the Admin Panel (`http://localhost:7000` > Settings > API Keys).
  - `NEXT_PUBLIC_MEDUSA_BACKEND_URL`: The URL of your backend (update if deployed on Render).

#### c. Start the Storefront

```bash
yarn dev
```

- The storefront will run at `http://localhost:3000`.
- Visit `http://localhost:3000` to view the store, with product prices displayed in VND.

## Deployment

### Backend (Render)

1. Create a Web Service on Render.
2. Connect to the `dat6778/Tech-Store-Team2` repository.
3. Select the `backend-admin` directory.
4. Add the following environment variables:

   ```
   DATABASE_URL=postgres://...  # Obtain from Neon
   REDIS_URL=redis://...        # Obtain from your Redis provider
   STORE_CORS=https://your-storefront.vercel.app,http://localhost:3000
   ```

5. Set the start command:

   ```
   yarn install && npx medusa db:migrate && npx medusa seed && npx medusa develop
   ```

### Storefront (Vercel)

1. Create a separate repository for `my-medusa-store-storefront`:

   ```bash
   cd my-medusa-store-storefront
   git init
   git add .
   git commit -m "Initial commit for storefront"
   git remote add origin https://github.com/dat6778/my-medusa-store-storefront.git
   git push -u origin main
   ```

2. Connect Vercel to the `my-medusa-store-storefront` repository.
3. Add the following environment variables:

   ```
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_publishable_key
   NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-render-backend-url
   ```

4. Deploy on Vercel.

## Notes

- **Product Images**: Currently, there are no images (as MinIO is not used). You can integrate Cloudinary if needed.
- **Payment**: You can integrate MoMo/VNPay by installing the `@medusajs/momo` or `@medusajs/vnpay` plugin.
- **CORS Issues**: If you encounter CORS errors, verify the `STORE_CORS` variable in the backend.

## Community & Contributions

The Medusa community and core team are available in [GitHub Discussions](https://github.com/medusajs/medusa/discussions), where you can ask for support, discuss the roadmap, and share ideas.

Join our [Discord server](https://discord.com/invite/medusajs) to meet other community members.

### Other Channels

- [GitHub Issues](https://github.com/medusajs/medusa/issues)
- [Twitter](https://twitter.com/medusajs)
- [LinkedIn](https://www.linkedin.com/company/medusajs)
- [Medusa Blog](https://medusajs.com/blog/)

If you face any issues while running the project, please check the steps above or open an issue on the repository!
