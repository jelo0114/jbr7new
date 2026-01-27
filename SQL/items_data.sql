-- items_data.sql
-- Insert all items from explore page into items table

USE `jbr7_db`;

-- Insert items from explore page
INSERT INTO `items` (`item_id`, `title`, `description`, `price`, `image`, `category`) VALUES
('eco-colored-tote', 'Eco Colored Tote Bag', 'Tote Bag Katsa White, Black and Colored — lightweight, durable, and perfect for everyday use.', 55.00, 'Tote Bag/Colored.png', 'jute-tote'),
('riki-tall-bag', 'Riki Tall Bag', 'Size: 29x22 x 1.5 inches', 850.00, 'Riki Bag/Riki.jpg', 'riki'),
('ringlight-bag', 'Ring Light Bag', 'Spacious duffel with premium materials, perfect for weekend getaways', 500.00, 'RingLight/Ringlight.jpg', 'ringlight'),
('plain-brass-backpack', 'Plain Brass Cotton Back Pack', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'One/ph-11134207-7ras8-m9txs8bfjp3gc0.jpg', 'backpack'),
('two-colored-backpack', 'Two Colored Brass Cotton Back Pack', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'Two Color/ph-11134207-7rasg-m9ty0a4dge0z1e.jpg', 'backpack'),
('vanity-mirror-bag', 'Vanity Mirror Bag', 'Durable canvas tote with reinforced handles and internal pockets', 400.00, 'Mirror Bag/68ba1e35671d997f6eb3ed1c376a4b27.jpg', 'vanity'),
('envelope-bag', 'Envelope Bags', 'Size 15*12.5inches', 70.00, 'Envelope Bag/ablue.png', 'envelop-module'),
('boys-kiddie-bag', 'Boys Kiddie Bag', 'Sizes: S, M, L', 140.00, 'Boys Kiddie Bag/BOYS.jpg', 'boys-kiddie'),
('girls-kiddie-bag', 'Girls Kiddie Bag', 'Sizes: S, M, L', 140.00, 'Girls Kiddie Bag/GIRL.jpg', 'girls-kiddie'),
('katrina-plain', 'Katrina Plain', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'Katrina Plain/Copy%20of%20Green%20Grey%20Simple%20Modern%20New%20Arrival%20Instagram%20Post%20(1).png', 'backpack'),
('katrina-two-colors', 'Katrina Two Colors', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'Katrina Two Colors/1.png', 'backpack'),
('module-bag', 'Module Bag', 'Size 15*12.5*3.5 inches Fabric Used: Poly Rubber and PVC Transparent', 90.00, 'Module/ph-11134207-7r98r-lxmbqd55abtt7c.avif', 'envelop-module')
ON DUPLICATE KEY UPDATE 
  `title` = VALUES(`title`),
  `description` = VALUES(`description`),
  `price` = VALUES(`price`),
  `image` = VALUES(`image`),
  `category` = VALUES(`category`);
