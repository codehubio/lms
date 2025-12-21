DROP TABLE IF EXISTS vocabulary;
DROP TABLE IF EXISTS sentence;
DROP TABLE IF EXISTS tag_group;
DROP TABLE IF EXISTS paragraph;
CREATE TABLE sentence as SELECT * FROM read_json_auto('data/sentence/*.json');
CREATE TABLE vocabulary as SELECT * FROM read_json_auto('data/vocabulary/*.json');
CREATE TABLE tag_group as SELECT * FROM read_json_auto('data/tag-group.json');
CREATE TABLE paragraph as SELECT * FROM read_json_auto('data/paragraph/*.json');