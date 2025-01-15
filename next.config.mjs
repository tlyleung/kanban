/** @type {import('next').NextConfig} */
const nextConfig = {
    assetPrefix: '/kanban/',
    basePath: '/kanban',
    eslint: { dirs: ['app', 'systems'] },
    output: "export",
};

export default nextConfig;
