CREATE TABLE "web_pv_designer_customuser" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "password" varchar(128) NOT NULL, "last_login" datetime NULL, "is_superuser" bool NOT NULL, "username" varchar(150) NOT NULL UNIQUE, "first_name" varchar(150) NOT NULL, "last_name" varchar(150) NOT NULL, "email" varchar(254) NOT NULL, "is_staff" bool NOT NULL, "is_active" bool NOT NULL, "date_joined" datetime NOT NULL);
CREATE TABLE "web_pv_designer_customuser_groups" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "customuser_id" bigint NOT NULL REFERENCES "web_pv_designer_customuser" ("id") DEFERRABLE INITIALLY DEFERRED, "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED);
SELECT AddGeometryColumn('web_pv_designer_customuser', 'home_location', 4326, 'POINT', 2, 0);
SELECT CreateSpatialIndex("web_pv_designer_customuser", "home_location");
CREATE TABLE "web_pv_designer_customuser_user_permissions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "customuser_id" bigint NOT NULL REFERENCES "web_pv_designer_customuser" ("id") DEFERRABLE INITIALLY DEFERRED, "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model Area
--
CREATE TABLE "web_pv_designer_area" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "panels_count" integer NOT NULL, "installed_peak_power" real NOT NULL, "mounting_position" varchar(20) NOT NULL, "slope" real NOT NULL, "azimuth" real NOT NULL, "title" varchar(255) NOT NULL, "rotations" integer NOT NULL);
SELECT AddGeometryColumn('web_pv_designer_area', 'polygon', 4326, 'POLYGON', 2, 0);
SELECT CreateSpatialIndex("web_pv_designer_area", "polygon");
--
-- Create model PVSystemDetails
--
CREATE TABLE "web_pv_designer_pvsystemdetails" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "title" varchar(255) NOT NULL, "system_loss" real NOT NULL, "pv_electricity_price" bool NOT NULL, "pv_system_cost" real NULL, "interest" real NULL, "lifetime" integer NULL, "consumption_per_year" real NULL, "created_at" datetime NOT NULL);
--
-- Create model SolarPanel
--
CREATE TABLE "web_pv_designer_solarpanel" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "manufacturer" varchar(100) NOT NULL, "model" varchar(100) NOT NULL, "width" real NOT NULL, "height" real NOT NULL, "power" real NOT NULL, "pv_technology" varchar(20) NOT NULL, "user_id" bigint NULL REFERENCES "web_pv_designer_customuser" ("id") DEFERRABLE INITIALLY DEFERRED);
--
-- Create model PVPowerPlant
--
CREATE TABLE "web_pv_designer_pvpowerplant" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "zoom" integer NOT NULL, "map_image" varchar(100) NULL, "solar_panel_id" bigint NULL REFERENCES "web_pv_designer_solarpanel" ("id") DEFERRABLE INITIALLY DEFERRED, "system_details_id" bigint NULL REFERENCES "web_pv_designer_pvsystemdetails" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" bigint NULL REFERENCES "web_pv_designer_customuser" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE "web_pv_designer_pvpowerplant_areas" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "pvpowerplant_id" bigint NOT NULL REFERENCES "web_pv_designer_pvpowerplant" ("id") DEFERRABLE INITIALLY DEFERRED, "area_id" bigint NOT NULL REFERENCES "web_pv_designer_area" ("id") DEFERRABLE INITIALLY DEFERRED);
SELECT AddGeometryColumn('web_pv_designer_pvpowerplant', 'location', 4326, 'POINT', 2, 1);
SELECT CreateSpatialIndex("web_pv_designer_pvpowerplant", "location");
--
-- Create model MonthlyConsumption
--
CREATE TABLE "web_pv_designer_monthlyconsumption" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "month" integer NOT NULL, "consumption" real NOT NULL, "power_plant_id" bigint NOT NULL REFERENCES "web_pv_designer_pvsystemdetails" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE UNIQUE INDEX "web_pv_designer_customuser_groups_customuser_id_group_id_9caf3795_uniq" ON "web_pv_designer_customuser_groups" ("customuser_id", "group_id");
CREATE INDEX "web_pv_designer_customuser_groups_customuser_id_5041ac45" ON "web_pv_designer_customuser_groups" ("customuser_id");
CREATE INDEX "web_pv_designer_customuser_groups_group_id_0ea3d6a8" ON "web_pv_designer_customuser_groups" ("group_id");
CREATE UNIQUE INDEX "web_pv_designer_customuser_user_permissions_customuser_id_permission_id_1ab3763b_uniq" ON "web_pv_designer_customuser_user_permissions" ("customuser_id", "permission_id");
CREATE INDEX "web_pv_designer_customuser_user_permissions_customuser_id_14f2ed65" ON "web_pv_designer_customuser_user_permissions" ("customuser_id");
CREATE INDEX "web_pv_designer_customuser_user_permissions_permission_id_1b592914" ON "web_pv_designer_customuser_user_permissions" ("permission_id");
CREATE INDEX "web_pv_designer_solarpanel_user_id_8bfa030d" ON "web_pv_designer_solarpanel" ("user_id");
CREATE INDEX "web_pv_designer_pvpowerplant_solar_panel_id_445a1dfe" ON "web_pv_designer_pvpowerplant" ("solar_panel_id");
CREATE INDEX "web_pv_designer_pvpowerplant_system_details_id_567619ca" ON "web_pv_designer_pvpowerplant" ("system_details_id");
CREATE INDEX "web_pv_designer_pvpowerplant_user_id_32fb5c75" ON "web_pv_designer_pvpowerplant" ("user_id");
CREATE UNIQUE INDEX "web_pv_designer_pvpowerplant_areas_pvpowerplant_id_area_id_9e6da348_uniq" ON "web_pv_designer_pvpowerplant_areas" ("pvpowerplant_id", "area_id");
CREATE INDEX "web_pv_designer_pvpowerplant_areas_pvpowerplant_id_f79b53a0" ON "web_pv_designer_pvpowerplant_areas" ("pvpowerplant_id");
CREATE INDEX "web_pv_designer_pvpowerplant_areas_area_id_0c3d2048" ON "web_pv_designer_pvpowerplant_areas" ("area_id");
CREATE UNIQUE INDEX "web_pv_designer_monthlyconsumption_power_plant_id_month_d192456f_uniq" ON "web_pv_designer_monthlyconsumption" ("power_plant_id", "month");
CREATE INDEX "web_pv_designer_monthlyconsumption_power_plant_id_9f42e18e" ON "web_pv_designer_monthlyconsumption" ("power_plant_id");
