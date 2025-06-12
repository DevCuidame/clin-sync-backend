-- Inserts para servicios de SPA (Precios en Pesos Colombianos)
INSERT INTO services (
    service_name,
    description,
    base_price,
    duration_minutes,
    category,
    is_active,
    metadata
) VALUES
    (
        'Masaje Relajante',
        'Masaje corporal completo con aceites esenciales para relajación profunda y alivio del estrés.',
        340000.00,
        60,
        'therapy',
        TRUE,
        '{"oils": ["lavanda", "eucalipto", "menta"], "pressure": "suave", "benefits": ["relajación", "alivio del estrés", "mejora circulación"], "currency": "COP"}'
    ),
    (
        'Masaje Terapéutico',
        'Masaje especializado para alivio de tensiones musculares y dolores específicos.',
        380000.00,
        75,
        'therapy',
        TRUE,
        '{"techniques": ["deep tissue", "trigger points"], "pressure": "media-fuerte", "benefits": ["alivio dolor muscular", "mejora movilidad", "reducción inflamación"], "currency": "COP"}'
    ),
    (
        'Facial Hidratante',
        'Tratamiento facial profundo con productos naturales para hidratación y rejuvenecimiento.',
        300000.00,
        90,
        'therapy',
        TRUE,
        '{"products": ["ácido hialurónico", "vitamina C", "colágeno"], "skin_types": ["seca", "mixta", "sensible"], "benefits": ["hidratación profunda", "anti-aging", "luminosidad"], "currency": "COP"}'
    ),
    (
        'Facial Anti-Edad',
        'Tratamiento facial avanzado con tecnología para combatir signos del envejecimiento.',
        480000.00,
        105,
        'therapy',
        TRUE,
        '{"technology": ["radiofrecuencia", "ultrasonido"], "products": ["retinol", "péptidos", "antioxidantes"], "benefits": ["reducción arrugas", "firmeza", "elasticidad"], "currency": "COP"}'
    ),
    (
        'Exfoliación Corporal',
        'Tratamiento de exfoliación completa con sales marinas y aceites nutritivos.',
        260000.00,
        45,
        'therapy',
        TRUE,
        '{"exfoliants": ["sales del mar muerto", "azúcar morena", "café"], "oils": ["coco", "almendras", "jojoba"], "benefits": ["piel suave", "eliminación células muertas", "hidratación"], "currency": "COP"}'
    ),
    (
        'Aromaterapia',
        'Sesión de relajación con aceites esenciales y técnicas de respiración.',
        220000.00,
        60,
        'therapy',
        TRUE,
        '{"essential_oils": ["lavanda", "bergamota", "ylang-ylang", "sándalo"], "techniques": ["inhalación", "difusión", "aplicación tópica"], "benefits": ["relajación mental", "equilibrio emocional", "mejora del sueño"], "currency": "COP"}'
    ),
    (
        'Manicure Spa',
        'Tratamiento completo de manos con exfoliación, hidratación y esmaltado.',
        140000.00,
        45,
        'other',
        TRUE,
        '{"includes": ["limado", "cutícula", "exfoliación", "masaje", "esmaltado"], "nail_art": "disponible", "products": ["cremas hidratantes", "aceites cutícula", "esmaltes premium"], "currency": "COP"}'
    ),
    (
        'Pedicure Spa',
        'Tratamiento completo de pies con baño relajante, exfoliación y masaje.',
        180000.00,
        60,
        'other',
        TRUE,
        '{"includes": ["baño de pies", "exfoliación", "masaje", "hidratación", "esmaltado"], "foot_bath": "sales aromáticas", "benefits": ["relajación", "pies suaves", "mejora circulación"], "currency": "COP"}'
    ),
    (
        'Depilación con Cera',
        'Servicio de depilación profesional con cera de alta calidad.',
        100000.00,
        30,
        'other',
        TRUE,
        '{"areas": ["piernas", "brazos", "axilas", "bikini", "cejas"], "wax_type": "cera tibia", "aftercare": ["gel calmante", "aceite hidratante"], "currency": "COP"}'
    ),
    (
        'Sauna',
        'Sesión de sauna finlandesa para desintoxicación y relajación.',
        120000.00,
        45,
        'therapy',
        TRUE,
        '{"temperature": "80-90°C", "humidity": "10-20%", "benefits": ["desintoxicación", "relajación muscular", "mejora circulación", "alivio estrés"], "currency": "COP"}'
    ),
    (
        'Jacuzzi',
        'Sesión de hidroterapia en jacuzzi con jets terapéuticos.',
        100000.00,
        30,
        'therapy',
        TRUE,
        '{"temperature": "37-40°C", "jets": "terapéuticos", "benefits": ["relajación muscular", "mejora circulación", "alivio tensión", "hidroterapia"], "currency": "COP"}'
    ),
    (
        'Consulta de Bienestar',
        'Evaluación personalizada de necesidades de bienestar y recomendaciones de tratamientos.',
        160000.00,
        30,
        'consultation',
        TRUE,
        '{"includes": ["análisis de piel", "evaluación postural", "recomendaciones personalizadas"], "follow_up": "plan de tratamiento", "currency": "COP"}'
    );

-- Inserts para paquetes de SPA (Precios en Pesos Colombianos)
INSERT INTO packages (
    package_name,
    description,
    price,
    total_sessions,
    validity_days,
    discount_percentage,
    is_active,
    terms_conditions
) VALUES
    (
        'Paquete Relajación Total',
        'Experiencia completa de relajación con masajes, facial y aromaterapia para el bienestar integral.',
        1199960.00,
        6,
        90,
        15.00,
        TRUE,
        '{"cancellation_policy": "24 horas de anticipación", "transfer_policy": "Transferible", "expiration_policy": "90 días desde la compra", "refund_policy": "Reembolso parcial hasta 7 días después de la compra", "currency": "COP"}'
    ),
    (
        'Paquete Belleza Premium',
        'Tratamientos faciales avanzados, manicure y pedicure spa para lucir radiante.',
        1799960.00,
        8,
        120,
        20.00,
        TRUE,
        '{"cancellation_policy": "24 horas de anticipación", "transfer_policy": "Transferible una vez", "expiration_policy": "120 días desde la compra", "refund_policy": "Reembolso completo hasta 14 días después de la compra", "priority_booking": true, "currency": "COP"}'
    ),
    (
        'Paquete Detox & Wellness',
        'Programa de desintoxicación con sauna, exfoliación corporal y masajes terapéuticos.',
        1519960.00,
        10,
        60,
        18.00,
        TRUE,
        '{"cancellation_policy": "48 horas de anticipación", "transfer_policy": "No transferible", "expiration_policy": "60 días desde la compra", "refund_policy": "Reembolso parcial hasta 10 días después de la compra", "detox_program": true, "currency": "COP"}'
    ),
    (
        'Paquete Parejas Romántico',
        'Experiencia romántica para parejas con masajes simultáneos, jacuzzi y tratamientos especiales.',
        2399960.00,
        4,
        90,
        12.00,
        TRUE,
        '{"cancellation_policy": "48 horas de anticipación", "transfer_policy": "No transferible", "expiration_policy": "90 días desde la compra", "refund_policy": "Reembolso parcial hasta 14 días después de la compra", "couples_package": true, "champagne_included": true, "currency": "COP"}'
    ),
    (
        'Paquete Mantenimiento Mensual',
        'Plan mensual de mantenimiento con servicios básicos para cuidado continuo.',
        799960.00,
        4,
        30,
        10.00,
        TRUE,
        '{"cancellation_policy": "24 horas de anticipación", "transfer_policy": "Transferible", "expiration_policy": "30 días desde la compra", "refund_policy": "Reembolso completo hasta 3 días después de la compra", "monthly_plan": true, "currency": "COP"}'
    ),
    (
        'Paquete Corporativo Bienestar',
        'Programa de bienestar empresarial con servicios de relajación para equipos de trabajo.',
        5199960.00,
        20,
        180,
        25.00,
        TRUE,
        '{"cancellation_policy": "72 horas de anticipación", "transfer_policy": "Transferible entre empleados", "expiration_policy": "180 días desde la compra", "refund_policy": "Reembolso según términos corporativos", "corporate_discount": true, "team_building": true, "currency": "COP"}'
    ),
    (
        'Paquete Anti-Edad Intensivo',
        'Tratamiento intensivo anti-envejecimiento con las últimas tecnologías y productos premium.',
        3199960.00,
        12,
        120,
        22.00,
        TRUE,
        '{"cancellation_policy": "48 horas de anticipación", "transfer_policy": "No transferible", "expiration_policy": "120 días desde la compra", "refund_policy": "Reembolso parcial hasta 14 días después de la compra", "anti_aging": true, "premium_products": true, "currency": "COP"}'
    ),
    (
        'Paquete Novia Especial',
        'Preparación completa para novias con tratamientos faciales, corporales y de belleza.',
        3599960.00,
        15,
        150,
        20.00,
        TRUE,
        '{"cancellation_policy": "72 horas de anticipación", "transfer_policy": "Transferible a damas de honor", "expiration_policy": "150 días desde la compra", "refund_policy": "Reembolso parcial hasta 21 días después de la compra", "bridal_package": true, "trial_session": true, "currency": "COP"}'
    ),
    (
        'Paquete Día de Spa',
        'Experiencia completa de día de spa con acceso a todas las instalaciones y servicios básicos.',
        639960.00,
        3,
        45,
        8.00,
        TRUE,
        '{"cancellation_policy": "24 horas de anticipación", "transfer_policy": "Transferible", "expiration_policy": "45 días desde la compra", "refund_policy": "Reembolso completo hasta 5 días después de la compra", "full_access": true, "lunch_included": true, "currency": "COP"}'
    ),
    (
        'Paquete Terapéutico',
        'Enfocado en alivio de dolores y tensiones con masajes terapéuticos especializados.',
        1399960.00,
        8,
        90,
        15.00,
        TRUE,
        '{"cancellation_policy": "24 horas de anticipación", "transfer_policy": "No transferible", "expiration_policy": "90 días desde la compra", "refund_policy": "Reembolso parcial hasta 10 días después de la compra", "therapeutic_focus": true, "pain_relief": true, "currency": "COP"}'
    );

-- Inserts para package_services (relación entre paquetes y servicios)
-- Nota: Los IDs de package y service se asumen secuenciales desde 1

INSERT INTO package_services (
    package_id,
    service_id,
    sessions_included
) VALUES
    -- Paquete Relajación Total (package_id: 61)
    (61, 77, 2),  -- Masaje Relajante - 2 sesiones
    (61, 79, 2),  -- Facial Hidratante - 2 sesiones
    (61, 82, 2),  -- Aromaterapia - 2 sesiones
    
    -- Paquete Belleza Premium (package_id: 62)
    (62, 79, 2),  -- Facial Hidratante - 2 sesiones
    (62, 80, 2),  -- Facial Anti-Edad - 2 sesiones
    (62, 83, 2),  -- Manicure Spa - 2 sesiones
    (62, 84, 2),  -- Pedicure Spa - 2 sesiones
    
    -- Paquete Detox & Wellness (package_id: 63)
    (63, 86, 3), -- Sauna - 3 sesiones
    (63, 81, 2),  -- Exfoliación Corporal - 2 sesiones
    (63, 78, 3),  -- Masaje Terapéutico - 3 sesiones
    (63, 87, 2), -- Jacuzzi - 2 sesiones
    
    -- Paquete Parejas Romántico (package_id: 64)
    (64, 77, 2),  -- Masaje Relajante - 2 sesiones (para pareja)
    (64, 87, 2), -- Jacuzzi - 2 sesiones
    
    -- Paquete Mantenimiento Mensual (package_id: 65)
    (65, 77, 1),  -- Masaje Relajante - 1 sesión
    (65, 79, 1),  -- Facial Hidratante - 1 sesión
    (65, 83, 1),  -- Manicure Spa - 1 sesión
    (65, 84, 1),  -- Pedicure Spa - 1 sesión
    
    -- Paquete Corporativo Bienestar (package_id: 66)
    (66, 77, 8),  -- Masaje Relajante - 8 sesiones
    (66, 82, 4),  -- Aromaterapia - 4 sesiones
    (66, 86, 4), -- Sauna - 4 sesiones
    (66, 87, 4), -- Jacuzzi - 4 sesiones
    
    -- Paquete Anti-Edad Intensivo (package_id: 67)
    (67, 80, 6),  -- Facial Anti-Edad - 6 sesiones
    (67, 79, 3),  -- Facial Hidratante - 3 sesiones
    (67, 81, 3),  -- Exfoliación Corporal - 3 sesiones
    
    -- Paquete Novia Especial (package_id: 68)
    (68, 80, 4),  -- Facial Anti-Edad - 4 sesiones
    (68, 79, 3),  -- Facial Hidratante - 3 sesiones
    (68, 83, 3),  -- Manicure Spa - 3 sesiones
    (68, 84, 3),  -- Pedicure Spa - 3 sesiones
    (68, 85, 2),  -- Depilación con Cera - 2 sesiones
    
    -- Paquete Día de Spa (package_id: 69)
    (69, 77, 1),  -- Masaje Relajante - 1 sesión
    (69, 86, 1), -- Sauna - 1 sesión
    (69, 87, 1), -- Jacuzzi - 1 sesión
    
    -- Paquete Terapéutico (package_id: 70)
    (70, 78, 4), -- Masaje Terapéutico - 4 sesiones
    (70, 88, 2),-- Consulta de Bienestar - 2 sesiones
    (70, 86, 2);-- Sauna - 2 sesiones

-- Comentarios sobre los paquetes de SPA:
-- 1. Paquete Relajación Total: Enfoque en relajación y bienestar general
-- 2. Paquete Belleza Premium: Tratamientos faciales y cuidado de manos/pies
-- 3. Paquete Detox & Wellness: Desintoxicación y terapias corporales
-- 4. Paquete Parejas Romántico: Experiencia romántica para dos personas
-- 5. Paquete Mantenimiento Mensual: Cuidado básico mensual
-- 6. Paquete Corporativo Bienestar: Servicios de relajación para empresas
-- 7. Paquete Anti-Edad Intensivo: Tratamientos especializados anti-envejecimiento
-- 8. Paquete Novia Especial: Preparación completa para bodas
-- 9. Paquete Día de Spa: Experiencia completa de un día
-- 10. Paquete Terapéutico: Enfoque en alivio de dolores y tensiones

-- Servicios incluidos:
-- 1. Masaje Relajante ($85, 60 min)
-- 2. Masaje Terapéutico ($95, 75 min)
-- 3. Facial Hidratante ($75, 90 min)
-- 4. Facial Anti-Edad ($120, 105 min)
-- 5. Exfoliación Corporal ($65, 45 min)
-- 6. Aromaterapia ($55, 60 min)
-- 7. Manicure Spa ($35, 45 min)
-- 8. Pedicure Spa ($45, 60 min)
-- 9. Depilación con Cera ($25, 30 min)
-- 10. Sauna ($30, 45 min)
-- 11. Jacuzzi ($25, 30 min)
-- 12. Consulta de Bienestar ($40, 30 min)






-- Inserts para package_services (relación entre paquetes y servicios)
-- Nota: Los IDs de package y service se asumen secuenciales desde 1

INSERT INTO package_services (
    package_id,
    service_id,
    sessions_included
) VALUES
    -- Paquete Relajación Total (package_id: 1)
    (1, 1, 2),  -- Masaje Relajante - 2 sesiones
    (1, 3, 2),  -- Facial Hidratante - 2 sesiones
    (1, 6, 2),  -- Aromaterapia - 2 sesiones
    
    -- Paquete Belleza Premium (package_id: 2)
    (2, 3, 2),  -- Facial Hidratante - 2 sesiones
    (2, 4, 2),  -- Facial Anti-Edad - 2 sesiones
    (2, 7, 2),  -- Manicure Spa - 2 sesiones
    (2, 8, 2),  -- Pedicure Spa - 2 sesiones
    
    -- Paquete Detox & Wellness (package_id: 3)
    (3, 10, 3), -- Sauna - 3 sesiones
    (3, 5, 2),  -- Exfoliación Corporal - 2 sesiones
    (3, 2, 3),  -- Masaje Terapéutico - 3 sesiones
    (3, 11, 2), -- Jacuzzi - 2 sesiones
    
    -- Paquete Parejas Romántico (package_id: 4)
    (4, 1, 2),  -- Masaje Relajante - 2 sesiones (para pareja)
    (4, 11, 2), -- Jacuzzi - 2 sesiones
    
    -- Paquete Mantenimiento Mensual (package_id: 5)
    (5, 1, 1),  -- Masaje Relajante - 1 sesión
    (5, 3, 1),  -- Facial Hidratante - 1 sesión
    (5, 7, 1),  -- Manicure Spa - 1 sesión
    (5, 8, 1),  -- Pedicure Spa - 1 sesión
    
    -- Paquete Corporativo Bienestar (package_id: 6)
    (6, 1, 8),  -- Masaje Relajante - 8 sesiones
    (6, 6, 4),  -- Aromaterapia - 4 sesiones
    (6, 10, 4), -- Sauna - 4 sesiones
    (6, 11, 4), -- Jacuzzi - 4 sesiones
    
    -- Paquete Anti-Edad Intensivo (package_id: 7)
    (7, 4, 6),  -- Facial Anti-Edad - 6 sesiones
    (7, 3, 3),  -- Facial Hidratante - 3 sesiones
    (7, 5, 3),  -- Exfoliación Corporal - 3 sesiones
    
    -- Paquete Novia Especial (package_id: 8)
    (8, 4, 4),  -- Facial Anti-Edad - 4 sesiones
    (8, 3, 3),  -- Facial Hidratante - 3 sesiones
    (8, 7, 3),  -- Manicure Spa - 3 sesiones
    (8, 8, 3),  -- Pedicure Spa - 3 sesiones
    (8, 9, 2),  -- Depilación con Cera - 2 sesiones
    
    -- Paquete Día de Spa (package_id: 9)
    (9, 1, 1),  -- Masaje Relajante - 1 sesión
    (9, 10, 1), -- Sauna - 1 sesión
    (9, 11, 1), -- Jacuzzi - 1 sesión
    
    -- Paquete Terapéutico (package_id: 10)
    (10, 2, 4), -- Masaje Terapéutico - 4 sesiones
    (10, 12, 2),-- Consulta de Bienestar - 2 sesiones
    (10, 10, 2);-- Sauna - 2 sesiones

-- Comentarios sobre los paquetes de SPA:
-- 1. Paquete Relajación Total: Enfoque en relajación y bienestar general
-- 2. Paquete Belleza Premium: Tratamientos faciales y cuidado de manos/pies
-- 3. Paquete Detox & Wellness: Desintoxicación y terapias corporales
-- 4. Paquete Parejas Romántico: Experiencia romántica para dos personas
-- 5. Paquete Mantenimiento Mensual: Cuidado básico mensual
-- 6. Paquete Corporativo Bienestar: Servicios de relajación para empresas
-- 7. Paquete Anti-Edad Intensivo: Tratamientos especializados anti-envejecimiento
-- 8. Paquete Novia Especial: Preparación completa para bodas
-- 9. Paquete Día de Spa: Experiencia completa de un día
-- 10. Paquete Terapéutico: Enfoque en alivio de dolores y tensiones

-- Servicios incluidos:
-- 1. Masaje Relajante ($85, 60 min)
-- 2. Masaje Terapéutico ($95, 75 min)
-- 3. Facial Hidratante ($75, 90 min)
-- 4. Facial Anti-Edad ($120, 105 min)
-- 5. Exfoliación Corporal ($65, 45 min)
-- 6. Aromaterapia ($55, 60 min)
-- 7. Manicure Spa ($35, 45 min)
-- 8. Pedicure Spa ($45, 60 min)
-- 9. Depilación con Cera ($25, 30 min)
-- 10. Sauna ($30, 45 min)
-- 11. Jacuzzi ($25, 30 min)
-- 12. Consulta de Bienestar ($40, 30 min)


