import { json } from '../db.js';

export function serializeCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    image: row.image ?? null,
    image_alt: row.image_alt ?? row.name,
    is_published: Boolean(row.is_published),
    sort_order: row.sort_order,
    product_count: row.product_count ?? undefined,
  };
}

/**
 * Public shape of a product. `has_price` is false whenever no real price has been
 * recorded in the admin panel — the UI then shows «قیمت ثبت نشده» and disables buying.
 */
export function serializeProduct(row) {
  const images = json.parse(row.images, []);
  const price = Number.isFinite(row.price) ? row.price : null;
  const sale = Number.isFinite(row.sale_price) ? row.sale_price : null;
  const effective = sale ?? price;
  const hasPrice = Number.isFinite(effective) && effective > 0;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    unit: row.unit ?? null,
    images,
    image: images[0]?.url ?? null,
    image_alt: images[0]?.alt ?? row.name,
    category: row.category_id
      ? { id: row.category_id, name: row.category_name ?? null, slug: row.category_slug ?? null }
      : null,
    price,
    sale_price: sale,
    effective_price: hasPrice ? effective : null,
    has_price: hasPrice,
    discount_percent:
      hasPrice && price && sale && sale < price ? Math.round((1 - sale / price) * 100) : 0,
    stock_quantity: row.stock_quantity ?? null,
    stock_state: row.stock_quantity === null || row.stock_quantity === undefined
      ? 'unset'
      : row.stock_quantity > 0
        ? 'in_stock'
        : 'out_of_stock',
    is_published: Boolean(row.is_published),
    is_featured: Boolean(row.is_featured),
    seo_title: row.seo_title ?? null,
    seo_description: row.seo_description ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
  };
}

export function serializeService(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    benefits: json.parse(row.benefits, []),
    image: row.image ?? null,
    image_alt: row.image_alt ?? row.name,
    is_published: Boolean(row.is_published),
    sort_order: row.sort_order,
  };
}

export function serializePortfolioItem(row) {
  const images = json.parse(row.images, []);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? null,
    category: row.category ?? null,
    images,
    image: images[0]?.url ?? null,
    image_alt: images[0]?.alt ?? row.title,
    area: row.area ?? null,
    specs: row.specs ?? null,
    is_sample: Boolean(row.is_sample),
    is_published: Boolean(row.is_published),
    sort_order: row.sort_order,
  };
}

export function serializeOrder(row, { privateView = false } = {}) {
  return {
    id: row.id,
    order_number: row.order_number,
    tracking_code: row.tracking_code,
    customer_name: row.customer_name,
    phone: row.phone,
    email: row.email ?? null,
    city: row.city ?? null,
    address: row.address ?? null,
    postal_code: row.postal_code ?? null,
    note: row.note ?? null,
    items: json.parse(row.items, []),
    subtotal: row.subtotal,
    discount: row.discount,
    shipping_cost: row.shipping_cost,
    total: row.total,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    order_status: row.order_status,
    is_test: Boolean(row.is_test),
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    history: privateView && row.history ? row.history : [],
  };
}

export function serializeProjectRequest(row) {
  return {
    id: row.id,
    tracking_code: row.tracking_code,
    customer_name: row.customer_name,
    phone: row.phone,
    project_type: row.project_type,
    service_type: row.service_type,
    estimated_area: row.estimated_area ?? null,
    location: row.location ?? null,
    description: row.description ?? null,
    attachments: json.parse(row.attachments, []),
    preferred_contact: row.preferred_contact,
    status: row.status,
    admin_note: row.admin_note ?? null,
    is_test: Boolean(row.is_test),
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
  };
}

export function serializeWholesaleRequest(row) {
  return {
    id: row.id,
    tracking_code: row.tracking_code,
    full_name: row.full_name,
    phone: row.phone,
    company: row.company ?? null,
    product_type: row.product_type,
    estimated_quantity: row.estimated_quantity,
    city: row.city,
    description: row.description ?? null,
    status: row.status,
    admin_note: row.admin_note ?? null,
    is_test: Boolean(row.is_test),
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
  };
}

export function serializeReview(row) {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    text: row.text,
    product_id: row.product_id ?? null,
    is_published: Boolean(row.is_published),
    created_at: row.created_at,
  };
}

export function serializePage(row) {
  return {
    slug: row.slug,
    title: row.title,
    seo_title: row.seo_title ?? null,
    seo_description: row.seo_description ?? null,
    body: row.body,
    updated_at: row.updated_at ?? null,
  };
}

export function serializeFaq(row) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    is_published: Boolean(row.is_published),
    sort_order: row.sort_order,
  };
}
