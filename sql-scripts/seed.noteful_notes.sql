BEGIN;

INSERT INTO noteful_notes (notename, modified, folderid, content)
VALUES
('Dogs', '2019-01-03T00:00:00.000Z', '3', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui. Velit ex animi reiciendis quasi. Suscipit totam delectus ut voluptas aut qui rerum. Non veniam eius molestiae rerum quam.'),
('Cats', '2018-08-15T23:00:00.000Z', '1', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui. Velit ex animi reiciendis quasi. Suscipit totam delectus ut voluptas aut qui rerum. Non veniam eius molestiae rerum quam.'),
('Pigs', '2018-03-01T00:00:00.000Z', '2', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui. Velit ex animi reiciendis quasi. Suscipit totam delectus ut voluptas aut qui rerum. Non veniam eius molestiae rerum quam.'),
('Birds','2019-01-04T00:00:00.000Z', '1', 'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui. Velit ex animi reiciendis quasi. Suscipit totam delectus ut voluptas aut qui rerum. Non veniam eius molestiae rerum quam.');

    COMMIT;