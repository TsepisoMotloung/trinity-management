"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEquipmentStatusDto = exports.UpdateEquipmentItemDto = exports.CreateEquipmentItemDto = exports.UpdateEquipmentCategoryDto = exports.CreateEquipmentCategoryDto = exports.EquipmentStatus = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
var EquipmentStatus;
(function (EquipmentStatus) {
    EquipmentStatus["AVAILABLE"] = "AVAILABLE";
    EquipmentStatus["RESERVED"] = "RESERVED";
    EquipmentStatus["IN_USE"] = "IN_USE";
    EquipmentStatus["DAMAGED"] = "DAMAGED";
    EquipmentStatus["UNDER_REPAIR"] = "UNDER_REPAIR";
    EquipmentStatus["LOST"] = "LOST";
    EquipmentStatus["RETIRED"] = "RETIRED";
})(EquipmentStatus || (exports.EquipmentStatus = EquipmentStatus = {}));
class CreateEquipmentCategoryDto {
    name;
    description;
}
exports.CreateEquipmentCategoryDto = CreateEquipmentCategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Speakers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEquipmentCategoryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'All types of speakers and monitors' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEquipmentCategoryDto.prototype, "description", void 0);
class UpdateEquipmentCategoryDto {
    name;
    description;
}
exports.UpdateEquipmentCategoryDto = UpdateEquipmentCategoryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Speakers' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEquipmentCategoryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'All types of speakers and monitors' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEquipmentCategoryDto.prototype, "description", void 0);
class CreateEquipmentItemDto {
    name;
    description;
    categoryId;
    serialNumber;
    barcode;
    purchaseDate;
    purchasePrice;
    quantity;
    unit;
    notes;
    imageUrl;
}
exports.CreateEquipmentItemDto = CreateEquipmentItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'JBL EON615' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEquipmentItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '15-inch powered PA speaker with Bluetooth' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEquipmentItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-category' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEquipmentItemDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'JBL-EON615-001' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEquipmentItemDto.prototype, "serialNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'BC123456' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEquipmentItemDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEquipmentItemDto.prototype, "purchaseDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 599.99 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateEquipmentItemDto.prototype, "purchasePrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateEquipmentItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'piece' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEquipmentItemDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEquipmentItemDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEquipmentItemDto.prototype, "imageUrl", void 0);
class UpdateEquipmentItemDto {
    name;
    description;
    categoryId;
    serialNumber;
    barcode;
    purchaseDate;
    purchasePrice;
    quantity;
    unit;
    notes;
    imageUrl;
}
exports.UpdateEquipmentItemDto = UpdateEquipmentItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'JBL EON615' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEquipmentItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEquipmentItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateEquipmentItemDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEquipmentItemDto.prototype, "serialNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEquipmentItemDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateEquipmentItemDto.prototype, "purchaseDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateEquipmentItemDto.prototype, "purchasePrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateEquipmentItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEquipmentItemDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEquipmentItemDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEquipmentItemDto.prototype, "imageUrl", void 0);
class UpdateEquipmentStatusDto {
    status;
    reason;
}
exports.UpdateEquipmentStatusDto = UpdateEquipmentStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: EquipmentStatus }),
    (0, class_validator_1.IsEnum)(EquipmentStatus),
    __metadata("design:type", String)
], UpdateEquipmentStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Returned from event, in good condition' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEquipmentStatusDto.prototype, "reason", void 0);
//# sourceMappingURL=equipment.dto.js.map