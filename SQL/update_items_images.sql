-- update_items_images.sql
-- Updates items table with multiple images for each product based on image-manifest.json

USE `jbr7_db`;

-- Add images column if it doesn't exist (MySQL doesn't support IF NOT EXISTS in ALTER TABLE)
-- Run this separately if column already exists
-- ALTER TABLE `items` ADD COLUMN `images` JSON NULL AFTER `image`;

-- Update items with their complete image arrays from image-manifest.json
-- Eco Colored Tote Bag
UPDATE `items` 
SET `images` = JSON_ARRAY('Tote Bag/Colored.png', 'Tote Bag/Black.png', 'Tote Bag/White.png', 'Tote Bag/Sizes.jpg')
WHERE `item_id` = 'eco-colored-tote';

-- Riki Tall Bag
UPDATE `items` 
SET `images` = JSON_ARRAY('Riki Bag/Riki.jpg', 'Riki Bag/View1.jpg', 'Riki Bag/View2.jpg', 'Riki Bag/View3.jpg')
WHERE `item_id` = 'riki-tall-bag';

-- Ring Light Bag
UPDATE `items` 
SET `images` = JSON_ARRAY('RingLight/Ringlight.jpg', 'RingLight/View1.jpg', 'RingLight/View2.jpg', 'RingLight/View3.png', 'RingLight/View4.jpg')
WHERE `item_id` = 'ringlight-bag';

-- Plain Brass Cotton Back Pack (One folder)
UPDATE `items` 
SET `images` = JSON_ARRAY(
    'One/ph-11134207-7ras8-m9txs8bfjp3gc0.jpg',
    'One/ph-11134207-7ras8-m9txs9pdilz812.jpg',
    'One/ph-11134207-7rasa-m9txs9cc1ozocf.jpg',
    'One/ph-11134207-7rasb-m9txs904kypwb9.jpg',
    'One/ph-11134207-7rase-m9txs91sh4g4fa.jpg',
    'One/ph-11134207-7rasj-m9txs9867s9824.jpg',
    'One/ph-11134207-7rasj-m9txs9bs2i8c8e.jpg'
)
WHERE `item_id` = 'plain-brass-backpack';

-- Two Colored Brass Cotton Back Pack (Two Color folder)
UPDATE `items` 
SET `images` = JSON_ARRAY(
    'Two Color/ph-11134207-7rasg-m9ty0a4dge0z1e.jpg',
    'Two Color/ph-11134207-7ras9-m9txs8a1rcgcdf.jpg',
    'Two Color/ph-11134207-7ras9-m9txs8a23zk465.jpg',
    'Two Color/ph-11134207-7rasa-m9txs90oiqx00c.jpg',
    'Two Color/ph-11134207-7rasc-m9txs8a1lq6k26.jpg',
    'Two Color/ph-11134207-7rasd-m9txs8a1n4r03f.jpg',
    'Two Color/ph-11134207-7rasd-m9txs8a22kzo9a.jpg',
    'Two Color/ph-11134207-7rask-m9txs8a216f850.jpg',
    'Two Color/ph-11134207-7rasm-m9txs8a1ojbg7a.jpg'
)
WHERE `item_id` = 'two-colored-backpack';

-- Vanity Mirror Bag (Mirror Bag folder)
UPDATE `items` 
SET `images` = JSON_ARRAY(
    'Mirror Bag/68ba1e35671d997f6eb3ed1c376a4b27.jpg',
    'Mirror Bag/c478589e0dd22f83b034d6bbf99f5489.jpg'
)
WHERE `item_id` = 'vanity-mirror-bag';

-- Envelope Bags
UPDATE `items` 
SET `images` = JSON_ARRAY(
    'Envelope Bag/ablue.png',
    'Envelope Bag/black.png',
    'Envelope Bag/e green.png',
    'Envelope Bag/fpink.png',
    'Envelope Bag/lgreen.png',
    'Envelope Bag/nblue.png',
    'Envelope Bag/RED.png',
    'Envelope Bag/yellow.png'
)
WHERE `item_id` = 'envelope-bag';

-- Boys Kiddie Bag
UPDATE `items` 
SET `images` = JSON_ARRAY(
    'Boys Kiddie Bag/BOYS.jpg',
    'Boys Kiddie Bag/BATMAN.jpg',
    'Boys Kiddie Bag/cars.jpg',
    'Boys Kiddie Bag/iron man.jpg',
    'Boys Kiddie Bag/spiderman.jpg',
    'Boys Kiddie Bag/SUPERMAN.jpg'
)
WHERE `item_id` = 'boys-kiddie-bag';

-- Girls Kiddie Bag
UPDATE `items` 
SET `images` = JSON_ARRAY(
    'Girls Kiddie Bag/GIRL.jpg',
    'Girls Kiddie Bag/BARBIE.jpg',
    'Girls Kiddie Bag/FROZEN.jpg',
    'Girls Kiddie Bag/FROZN.jpg',
    'Girls Kiddie Bag/HKITTY.jpg',
    'Girls Kiddie Bag/SOFIA.jpg'
)
WHERE `item_id` = 'girls-kiddie-bag';

-- Katrina Plain
UPDATE `items` 
SET `images` = JSON_ARRAY(
    'Katrina Plain/Copy%20of%20Green%20Grey%20Simple%20Modern%20New%20Arrival%20Instagram%20Post%20(1).png',
    'Katrina Plain/Copy%20of%20Green%20Grey%20Simple%20Modern%20New%20Arrival%20Instagram%20Post%20(2).png',
    'Katrina Plain/Copy%20of%20Green%20Grey%20Simple%20Modern%20New%20Arrival%20Instagram%20Post%20(3).png',
    'Katrina Plain/Copy%20of%20Green%20Grey%20Simple%20Modern%20New%20Arrival%20Instagram%20Post%20(4).png',
    'Katrina Plain/Copy%20of%20Green%20Grey%20Simple%20Modern%20New%20Arrival%20Instagram%20Post%20(5).png',
    'Katrina Plain/Copy%20of%20Green%20Grey%20Simple%20Modern%20New%20Arrival%20Instagram%20Post%20(6).png',
    'Katrina Plain/Copy%20of%20Green%20Grey%20Simple%20Modern%20New%20Arrival%20Instagram%20Post.png',
    'Katrina Plain/Copy%20of%20Turquoise%20brown%20explore%20Turkey%20framed%20tourism%20photo%20collage%20.png'
)
WHERE `item_id` = 'katrina-plain';

-- Katrina Two Colors
UPDATE `items` 
SET `images` = JSON_ARRAY(
    'Katrina Two Colors/1.png',
    'Katrina Two Colors/2.png',
    'Katrina Two Colors/3.png',
    'Katrina Two Colors/4.png',
    'Katrina Two Colors/5.png',
    'Katrina Two Colors/6.png',
    'Katrina Two Colors/7.png',
    'Katrina Two Colors/8.png'
)
WHERE `item_id` = 'katrina-two-colors';

-- Module Bag
UPDATE `items` 
SET `images` = JSON_ARRAY(
    'Module/ph-11134207-7r98r-lxmbqd55abtt7c.avif',
    'Module/ph-11134207-7r98s-lxmbqd553azl8a.avif',
    'Module/ph-11134207-7r98v-lxmbqd558x9d1f.avif',
    'Module/ph-11134207-7r98y-lxmbqd55d4yp9e.avif',
    'Module/ph-11134207-7r98z-lxmbqd557iox98.avif',
    'Module/ph-11134207-7r991-lxmbqd55644h4a.avif',
    'Module/ph-11134207-7r991-lxmbqd55bqe93b.avif',
    'Module/ph-11134207-7rase-m0s7s6efed5085.avif'
)
WHERE `item_id` = 'module-bag';

-- For items without images array, use the main image
UPDATE `items` 
SET `images` = JSON_ARRAY(`image`)
WHERE (`images` IS NULL OR JSON_LENGTH(`images`) = 0) AND `image` IS NOT NULL;
