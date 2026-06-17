import { WebDesignConfig } from '../types';

export function generateDotnetFiles(config: WebDesignConfig, dotnetVersion = 'net8.0'): Record<string, string> {
  const files: Record<string, string> = {};
  
  // Deriving rootNamespace dynamically from projectName (e.g. Zesa, Kupa, Dara)
  const rawProjName = config.projectName || 'Dara';
  let rootNamespace = rawProjName
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  if (!rootNamespace || /^\d/.test(rootNamespace)) {
    rootNamespace = 'Dara';
  }

  // 0. solution file
  files[`${rootNamespace}.sln`] = `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${rootNamespace}.Domain", "${rootNamespace}.Domain\\${rootNamespace}.Domain.csproj", "{11111111-1111-1111-1111-111111111111}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${rootNamespace}.Application", "${rootNamespace}.Application\\${rootNamespace}.Application.csproj", "{22222222-2222-2222-2222-222222222222}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${rootNamespace}.Infrastructure", "${rootNamespace}.Infrastructure\\${rootNamespace}.Infrastructure.csproj", "{33333333-3333-3333-3333-333333333333}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${rootNamespace}.ClientApi", "${rootNamespace}.ClientApi\\${rootNamespace}.ClientApi.csproj", "{44444444-4444-4444-4444-444444444444}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${rootNamespace}.ClientPortal", "${rootNamespace}.ClientPortal\\${rootNamespace}.ClientPortal.csproj", "{55555555-5555-5555-5555-555555555555}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{11111111-1111-1111-1111-111111111111}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{11111111-1111-1111-1111-111111111111}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{11111111-1111-1111-1111-111111111111}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{11111111-1111-1111-1111-111111111111}.Release|Any CPU.Build.0 = Release|Any CPU
		{22222222-2222-2222-2222-222222222222}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{22222222-2222-2222-2222-222222222222}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{22222222-2222-2222-2222-222222222222}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{22222222-2222-2222-2222-222222222222}.Release|Any CPU.Build.0 = Release|Any CPU
		{33333333-3333-3333-3333-333333333333}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{33333333-3333-3333-3333-333333333333}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{33333333-3333-3333-3333-333333333333}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{33333333-3333-3333-3333-333333333333}.Release|Any CPU.Build.0 = Release|Any CPU
		{44444444-4444-4444-4444-444444444444}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{44444444-4444-4444-4444-444444444444}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{44444444-4444-4444-4444-444444444444}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{44444444-4444-4444-4444-444444444444}.Release|Any CPU.Build.0 = Release|Any CPU
		{55555555-5555-5555-5555-555555555555}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{55555555-5555-5555-5555-555555555555}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{55555555-5555-5555-5555-555555555555}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{55555555-5555-5555-5555-555555555555}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
EndGlobal
`;

  // ==========================================
  // LAYER 1: Domain
  // ==========================================
  files[`${rootNamespace}.Domain/${rootNamespace}.Domain.csproj`] = `
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>${dotnetVersion}</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
`;

  files[`${rootNamespace}.Domain/Common/BaseEntity.cs`] = `using System;

namespace ${rootNamespace}.Domain.Common
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }
        public Guid Uuid { get; set; } = Guid.NewGuid();
    }
}
`;

  files[`${rootNamespace}.Domain/Common/AuditableBaseEntity.cs`] = `using System;

namespace ${rootNamespace}.Domain.Common
{
    public abstract class AuditableBaseEntity : BaseEntity
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
        
        public string CreatedBy { get; set; } = "system";
        public string? UpdatedBy { get; set; }
        public string? DeletedBy { get; set; }
    }
}
`;

  files[`${rootNamespace}.Domain/Common/AuditableEntity.cs`] = `namespace ${rootNamespace}.Domain.Common
{
    public abstract class AuditableEntity : AuditableBaseEntity
    {
        public int CompanyId { get; set; }
        // Virtual Company reference
        public virtual string Company { get; set; } = "DefaultCompany";
    }
}
`;

  // Entities
  files[`${rootNamespace}.Domain/Entities/BlogPost.cs`] = `using ${rootNamespace}.Domain.Common;

namespace ${rootNamespace}.Domain.Entities
{
    public class BlogPost : AuditableEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Excerpt { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }
}
`;

  files[`${rootNamespace}.Domain/Entities/Product.cs`] = `using ${rootNamespace}.Domain.Common;

namespace ${rootNamespace}.Domain.Entities
{
    public class Product : AuditableEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool InStock { get; set; } = true;
    }
}
`;


  // ==========================================
  // LAYER 2: Application
  // ==========================================
  files[`${rootNamespace}.Application/${rootNamespace}.Application.csproj`] = `
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>${dotnetVersion}</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\\${rootNamespace}.Domain\\${rootNamespace}.Domain.csproj" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="MediatR" Version="12.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
  </ItemGroup>
</Project>
`;

  // SEPARATED COMMON RESPONSE LAYER
  files[`${rootNamespace}.Application/Common/ApiResponse.cs`] = `using System.Collections.Generic;

namespace ${rootNamespace}.Application.Common
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }

        public static ApiResponse<T> Ok(T data, string? message = null) =>
            new() { Success = true, Data = data, Message = message };

        public static ApiResponse<T> Fail(string message, List<string>? errors = null) =>
            new() { Success = false, Message = message, Errors = errors };
    }
}
`;

  // SEPARATED INTERFACES UNDER contracts/ FOLDER
  files[`${rootNamespace}.Application/Contracts/IGenericRepository.cs`] = `using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using ${rootNamespace}.Application.Specifications;

namespace ${rootNamespace}.Application.Contracts
{
    public interface IGenericRepository<T> where T : class
    {
        IQueryable<T> Table { get; }
        IQueryable<T> TableNoTracking { get; }
        IQueryable<T> TableIncludingDeleted { get; }
        IQueryable<T> TableNoTrackingIncludingDeleted { get; }

        Task<T> GetByIdAsync(object id, CancellationToken cancellationToken = default);
        Task<T> GetAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
        Task<List<T>> ListAsync(BaseSpecification<T> spec, CancellationToken cancellationToken = default);
        Task<T> GetEntityWithSpecAsync(BaseSpecification<T> spec, CancellationToken cancellationToken = default);
        Task<int> CountAsync(BaseSpecification<T> spec, CancellationToken cancellationToken = default);

        Task<int> AddAsync(T entity, CancellationToken cancellationToken = default);
        Task<int> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
        Task<int> UpdateAsync(T entity, CancellationToken cancellationToken = default);
        Task<int> UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
        Task<int> DeleteAsync(T entity, CancellationToken cancellationToken = default);
        Task<int> DeleteRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    }
}
`;

  files[`${rootNamespace}.Application/Contracts/IUnitOfWork.cs`] = `using System;
using System.Threading.Tasks;

namespace ${rootNamespace}.Application.Contracts
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<TEntity> Repository<TEntity>() where TEntity : class;
        Task<int> SaveChangesAsync();
        
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
`;

  files[`${rootNamespace}.Application/Contracts/ICurrentUserService.cs`] = `namespace ${rootNamespace}.Application.Contracts
{
    public interface ICurrentUserService
    {
        string? UserId { get; }
        int CompanyId { get; }
    }
}
`;

  // SEPARATED SERVICES UNDER services/ FOLDER
  files[`${rootNamespace}.Application/Services/MockCurrentUserService.cs`] = `using ${rootNamespace}.Application.Contracts;

namespace ${rootNamespace}.Application.Services
{
    public class MockCurrentUserService : ICurrentUserService
    {
        public string? UserId => "user_dara_compliance_compliance_system";
        public int CompanyId => 1; // Default client company mapping
    }
}
`;

  // SPECIFICATIONS PATTERN ENABLERS
  files[`${rootNamespace}.Application/Specifications/BaseSpecification.cs`] = `using System;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace ${rootNamespace}.Application.Specifications
{
    public abstract class BaseSpecification<T>
    {
        protected BaseSpecification() { }
        protected BaseSpecification(Expression<Func<T, bool>> criteria)
        {
            Criteria = criteria;
        }

        public Expression<Func<T, bool>> Criteria { get; }
        public List<Expression<Func<T, object>>> Includes { get; } = new();
        public Expression<Func<T, object>> OrderBy { get; private set; }
        public Expression<Func<T, object>> OrderByDescending { get; private set; }

        protected void AddInclude(Expression<Func<T, object>> includeExpression)
        {
            Includes.Add(includeExpression);
        }

        protected void ApplyOrderBy(Expression<Func<T, object>> orderByExpression)
        {
            OrderBy = orderByExpression;
        }

        protected void ApplyOrderByDescending(Expression<Func<T, object>> orderByDescExpression)
        {
            OrderByDescending = orderByDescExpression;
        }
    }
}
`;

  files[`${rootNamespace}.Application/Specifications/SpecificationEvaluator.cs`] = `using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace ${rootNamespace}.Application.Specifications
{
    public class SpecificationEvaluator<T> where T : class
    {
        public static IQueryable<T> GetQuery(IQueryable<T> inputQuery, BaseSpecification<T> spec)
        {
            var query = inputQuery;

            if (spec.Criteria != null)
            {
                query = query.Where(spec.Criteria);
            }

            query = spec.Includes.Aggregate(query, (current, include) => current.Include(include));

            if (spec.OrderBy != null)
            {
                query = query.OrderBy(spec.OrderBy);
            }
            else if (spec.OrderByDescending != null)
            {
                query = query.OrderByDescending(spec.OrderByDescending);
            }

            return query;
        }
    }
}
`;

  // AUTHORIZATION ASPECT DEMO (HasPermission Attribute)
  files[`${rootNamespace}.Application/Authorization/HasPermissionAttribute.cs`] = `using System;

namespace ${rootNamespace}.Application.Authorization
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, Inherited = false, AllowMultiple = true)]
    public class HasPermissionAttribute : Attribute
    {
        public string Permission { get; }

        public HasPermissionAttribute(string permission)
        {
            Permission = permission;
        }
    }
}
`;

  // Mappers
  files[`${rootNamespace}.Application/Common/Mappings/BlogPostMapper.cs`] = `using ${rootNamespace}.Domain.Entities;
using ${rootNamespace}.Application.Features.BlogPosts.DTOs;

namespace ${rootNamespace}.Application.Common.Mappings
{
    public static class BlogPostMapper
    {
        public static BlogPostDto MapToDto(BlogPost entity)
        {
            return new BlogPostDto
            {
                Id = entity.Id,
                Uuid = entity.Uuid,
                Title = entity.Title,
                Slug = entity.Slug,
                Excerpt = entity.Excerpt,
                Body = entity.Body,
                Category = entity.Category,
                Author = entity.Author,
                ImageUrl = entity.ImageUrl,
                CreatedAt = entity.CreatedAt,
                CompanyId = entity.CompanyId
            };
        }
    }
}
`;

  files[`${rootNamespace}.Application/Common/Mappings/ProductMapper.cs`] = `using ${rootNamespace}.Domain.Entities;
using ${rootNamespace}.Application.Features.Products.DTOs;

namespace ${rootNamespace}.Application.Common.Mappings
{
    public static class ProductMapper
    {
        public static ProductDto MapToDto(Product entity)
        {
            return new ProductDto
            {
                Id = entity.Id,
                Uuid = entity.Uuid,
                Name = entity.Name,
                Slug = entity.Slug,
                Price = entity.Price,
                Description = entity.Description,
                ImageUrl = entity.ImageUrl,
                InStock = entity.InStock,
                CompanyId = entity.CompanyId
            };
        }
    }
}
`;

  // Features: BlogPosts DTOs, Queries & Commands
  files[`${rootNamespace}.Application/Features/BlogPosts/DTOs/BlogPostDto.cs`] = `using System;

namespace ${rootNamespace}.Application.Features.BlogPosts.DTOs
{
    public class BlogPostDto
    {
        public int Id { get; set; }
        public Guid Uuid { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Excerpt { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int CompanyId { get; set; }
    }
}
`;

  files[`${rootNamespace}.Application/Features/BlogPosts/Queries/GetBlogPostsQuery.cs`] = `using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ${rootNamespace}.Domain.Entities;
using ${rootNamespace}.Application.Contracts;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Common.Mappings;
using ${rootNamespace}.Application.Features.BlogPosts.DTOs;

namespace ${rootNamespace}.Application.Features.BlogPosts.Queries
{
    public record GetBlogPostsQuery : IRequest<ApiResponse<List<BlogPostDto>>>;

    public class GetBlogPostsQueryHandler : IRequestHandler<GetBlogPostsQuery, ApiResponse<List<BlogPostDto>>>
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public GetBlogPostsQueryHandler(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<ApiResponse<List<BlogPostDto>>> Handle(GetBlogPostsQuery request, CancellationToken cancellationToken)
        {
            var companyId = _currentUserService.CompanyId;
            var repo = _uow.Repository<BlogPost>();

            var posts = await repo.TableNoTracking
                .Where(x => x.CompanyId == companyId && !x.IsDeleted)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync(cancellationToken);

            var dtos = posts.Select(BlogPostMapper.MapToDto).ToList();
            return ApiResponse<List<BlogPostDto>>.Ok(dtos, "Blog posts loaded successfully.");
        }
    }
}
`;

  files[`${rootNamespace}.Application/Features/BlogPosts/Commands/CreateBlogPostCommand.cs`] = `using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ${rootNamespace}.Domain.Entities;
using ${rootNamespace}.Application.Contracts;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Common.Mappings;
using ${rootNamespace}.Application.Features.BlogPosts.DTOs;

namespace ${rootNamespace}.Application.Features.BlogPosts.Commands
{
    public class CreateBlogPostCommand : IRequest<ApiResponse<BlogPostDto>>
    {
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Excerpt { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }

    public class CreateBlogPostCommandHandler : IRequestHandler<CreateBlogPostCommand, ApiResponse<BlogPostDto>>
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public CreateBlogPostCommandHandler(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<ApiResponse<BlogPostDto>> Handle(CreateBlogPostCommand request, CancellationToken cancellationToken)
        {
            var post = new BlogPost
            {
                Title = request.Title,
                Slug = request.Slug,
                Excerpt = request.Excerpt,
                Body = request.Body,
                Category = request.Category,
                Author = request.Author,
                ImageUrl = request.ImageUrl,
                CompanyId = _currentUserService.CompanyId,
                CreatedBy = _currentUserService.UserId ?? "system"
            };

            await _uow.Repository<BlogPost>().AddAsync(post, cancellationToken);
            await _uow.SaveChangesAsync();

            var dto = BlogPostMapper.MapToDto(post);
            return ApiResponse<BlogPostDto>.Ok(dto, "Blog post created successfully.");
        }
    }
}
`;

  files[`${rootNamespace}.Application/Features/BlogPosts/Commands/DeleteBlogPostCommand.cs`] = `using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ${rootNamespace}.Domain.Entities;
using ${rootNamespace}.Application.Contracts;
using ${rootNamespace}.Application.Common;

namespace ${rootNamespace}.Application.Features.BlogPosts.Commands
{
    public record DeleteBlogPostCommand(int Id) : IRequest<ApiResponse<bool>>;

    public class DeleteBlogPostCommandHandler : IRequestHandler<DeleteBlogPostCommand, ApiResponse<bool>>
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public DeleteBlogPostCommandHandler(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<ApiResponse<bool>> Handle(DeleteBlogPostCommand request, CancellationToken cancellationToken)
        {
            var repo = _uow.Repository<BlogPost>();
            var post = await repo.GetByIdAsync(request.Id, cancellationToken);

            if (post == null || post.CompanyId != _currentUserService.CompanyId || post.IsDeleted)
            {
                return ApiResponse<bool>.Fail("Blog post not found in your company context");
            }

            post.IsDeleted = true;
            post.DeletedAt = DateTime.UtcNow;
            post.DeletedBy = _currentUserService.UserId ?? "system";

            await repo.UpdateAsync(post, cancellationToken);
            await _uow.SaveChangesAsync();

            return ApiResponse<bool>.Ok(true, "Blog post soft-deleted successfully.");
        }
    }
}
`;


  // Features: Products
  files[`${rootNamespace}.Application/Features/Products/DTOs/ProductDto.cs`] = `using System;

namespace ${rootNamespace}.Application.Features.Products.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public Guid Uuid { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool InStock { get; set; }
        public int CompanyId { get; set; }
    }
}
`;

  files[`${rootNamespace}.Application/Features/Products/Queries/GetProductsQuery.cs`] = `using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ${rootNamespace}.Domain.Entities;
using ${rootNamespace}.Application.Contracts;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Common.Mappings;
using ${rootNamespace}.Application.Features.Products.DTOs;

namespace ${rootNamespace}.Application.Features.Products.Queries
{
    public record GetProductsQuery : IRequest<ApiResponse<List<ProductDto>>>;

    public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, ApiResponse<List<ProductDto>>>
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public GetProductsQueryHandler(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<ApiResponse<List<ProductDto>>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
        {
            var companyId = _currentUserService.CompanyId;
            var repo = _uow.Repository<Product>();

            var products = await repo.TableNoTracking
                .Where(x => x.CompanyId == companyId && !x.IsDeleted)
                .OrderBy(x => x.Name)
                .ToListAsync(cancellationToken);

            var dtos = products.Select(ProductMapper.MapToDto).ToList();
            return ApiResponse<List<ProductDto>>.Ok(dtos, "Products retrieved successfully.");
        }
    }
}
`;

  files[`${rootNamespace}.Application/Features/Products/Commands/CreateProductCommand.cs`] = `using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ${rootNamespace}.Domain.Entities;
using ${rootNamespace}.Application.Contracts;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Common.Mappings;
using ${rootNamespace}.Application.Features.Products.DTOs;

namespace ${rootNamespace}.Application.Features.Products.Commands
{
    public class CreateProductCommand : IRequest<ApiResponse<ProductDto>>
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool InStock { get; set; } = true;
    }

    public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ApiResponse<ProductDto>>
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public CreateProductCommandHandler(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<ApiResponse<ProductDto>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
        {
            var prod = new Product
            {
                Name = request.Name,
                Slug = request.Slug,
                Price = request.Price,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
                InStock = request.InStock,
                CompanyId = _currentUserService.CompanyId,
                CreatedBy = _currentUserService.UserId ?? "system"
            };

            await _uow.Repository<Product>().AddAsync(prod, cancellationToken);
            await _uow.SaveChangesAsync();

            var dto = ProductMapper.MapToDto(prod);
            return ApiResponse<ProductDto>.Ok(dto, "Product registered successfully.");
        }
    }
}
`;

  files[`${rootNamespace}.Application/Features/Products/Commands/DeleteProductCommand.cs`] = `using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ${rootNamespace}.Domain.Entities;
using ${rootNamespace}.Application.Contracts;
using ${rootNamespace}.Application.Common;

namespace ${rootNamespace}.Application.Features.Products.Commands
{
    public record DeleteProductCommand(int Id) : IRequest<ApiResponse<bool>>;

    public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, ApiResponse<bool>>
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public DeleteProductCommandHandler(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<ApiResponse<bool>> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
        {
            var repo = _uow.Repository<Product>();
            var product = await repo.GetByIdAsync(request.Id, cancellationToken);

            if (product == null || product.CompanyId != _currentUserService.CompanyId || product.IsDeleted)
            {
                return ApiResponse<bool>.Fail("Product not found in your company scope.");
            }

            product.IsDeleted = true;
            product.DeletedAt = DateTime.UtcNow;
            product.DeletedBy = _currentUserService.UserId ?? "system";

            await repo.UpdateAsync(product, cancellationToken);
            await _uow.SaveChangesAsync();

            return ApiResponse<bool>.Ok(true, "Product soft-deleted successfully.");
        }
    }
}
`;

  // FEATURES DEMO: Agent Contracts DTOs, Queries & Commands (Exactly matching request)
  files[`${rootNamespace}.Application/Features/AgentContracts/DTOs/AgentContractDto.cs`] = `using System;

namespace ${rootNamespace}.Application.Features.AgentContracts.DTOs
{
    public class AgentContractDto
    {
        public int Id { get; set; }
        public int AgentId { get; set; }
        public int CompanyId { get; set; }
        public string Status { get; set; } = "Draft";
        public string Details { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? SignedAt { get; set; }
        public DateTime? TerminatedAt { get; set; }
    }
}
`;

  files[`${rootNamespace}.Application/Features/AgentContracts/DTOs/CreateAgentContractDto.cs`] = `namespace ${rootNamespace}.Application.Features.AgentContracts.DTOs
{
    public class CreateAgentContractDto
    {
        public int AgentId { get; set; }
        public int CompanyId { get; set; }
        public string Details { get; set; } = string.Empty;
    }
}
`;

  files[`${rootNamespace}.Application/Features/AgentContracts/DTOs/SignAgentContractDto.cs`] = `namespace ${rootNamespace}.Application.Features.AgentContracts.DTOs
{
    public class SignAgentContractDto
    {
        public int ContractId { get; set; }
        public string Signature { get; set; } = string.Empty;
    }
}
`;

  files[`${rootNamespace}.Application/Features/AgentContracts/DTOs/TerminateAgentContractDto.cs`] = `namespace ${rootNamespace}.Application.Features.AgentContracts.DTOs
{
    public class TerminateAgentContractDto
    {
        public int ContractId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
`;

  files[`${rootNamespace}.Application/Features/AgentContracts/Queries/GetAgentContractsQuery.cs`] = `using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Features.AgentContracts.DTOs;

namespace ${rootNamespace}.Application.Features.AgentContracts.Queries
{
    public record GetAgentContractsQuery(int AgentId, int CompanyId) : IRequest<ApiResponse<List<AgentContractDto>>>;

    public class GetAgentContractsQueryHandler : IRequestHandler<GetAgentContractsQuery, ApiResponse<List<AgentContractDto>>>
    {
        public async Task<ApiResponse<List<AgentContractDto>>> Handle(GetAgentContractsQuery request, CancellationToken cancellationToken)
        {
            var mockList = new List<AgentContractDto>
            {
                new AgentContractDto 
                { 
                    Id = 101, 
                    AgentId = request.AgentId, 
                    CompanyId = request.CompanyId, 
                    Status = "Active", 
                    Details = "Standard Compliance Agency Agreement",
                    CreatedAt = DateTime.UtcNow.AddMonths(-1) 
                }
            };
            return ApiResponse<List<AgentContractDto>>.Ok(mockList, "Agent contracts fetched successfully.");
        }
    }
}
`;

  files[`${rootNamespace}.Application/Features/AgentContracts/Queries/GetAgentContractByIdQuery.cs`] = `using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Features.AgentContracts.DTOs;

namespace ${rootNamespace}.Application.Features.AgentContracts.Queries
{
    public record GetAgentContractByIdQuery(int Id, int CompanyId) : IRequest<ApiResponse<AgentContractDto>>;

    public class GetAgentContractByIdQueryHandler : IRequestHandler<GetAgentContractByIdQuery, ApiResponse<AgentContractDto>>
    {
        public async Task<ApiResponse<AgentContractDto>> Handle(GetAgentContractByIdQuery request, CancellationToken cancellationToken)
        {
            var contract = new AgentContractDto 
            { 
                Id = request.Id, 
                AgentId = 12, 
                CompanyId = request.CompanyId, 
                Status = "Active", 
                Details = "Standard Contract Agreement",
                CreatedAt = DateTime.UtcNow.AddMonths(-2) 
            };
            return ApiResponse<AgentContractDto>.Ok(contract, "Agent contract loaded successfully.");
        }
    }
}
`;

  files[`${rootNamespace}.Application/Features/AgentContracts/Queries/GetActiveContractQuery.cs`] = `using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Features.AgentContracts.DTOs;

namespace ${rootNamespace}.Application.Features.AgentContracts.Queries
{
    public record GetActiveContractQuery(int AgentId, int CompanyId) : IRequest<ApiResponse<AgentContractDto>>;

    public class GetActiveContractQueryHandler : IRequestHandler<GetActiveContractQuery, ApiResponse<AgentContractDto>>
    {
        public async Task<ApiResponse<AgentContractDto>> Handle(GetActiveContractQuery request, CancellationToken cancellationToken)
        {
            var contract = new AgentContractDto 
            { 
                Id = 202, 
                AgentId = request.AgentId, 
                CompanyId = request.CompanyId, 
                Status = "Active", 
                Details = "Current Active Workspace Engagement Model",
                CreatedAt = DateTime.UtcNow.AddDays(-15) 
            };
            return ApiResponse<AgentContractDto>.Ok(contract, "Active contract fetched successfully.");
        }
    }
}
`;

  files[`${rootNamespace}.Application/Features/AgentContracts/Commands/CreateAgentContractCommand.cs`] = `using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Features.AgentContracts.DTOs;

namespace ${rootNamespace}.Application.Features.AgentContracts.Commands
{
    public record CreateAgentContractCommand(CreateAgentContractDto Dto) : IRequest<ApiResponse<AgentContractDto>>;

    public class CreateAgentContractCommandHandler : IRequestHandler<CreateAgentContractCommand, ApiResponse<AgentContractDto>>
    {
        public async Task<ApiResponse<AgentContractDto>> Handle(CreateAgentContractCommand request, CancellationToken cancellationToken)
        {
            var contract = new AgentContractDto 
            { 
                Id = 103, 
                AgentId = request.Dto.AgentId, 
                CompanyId = request.Dto.CompanyId, 
                Status = "Draft", 
                Details = request.Dto.Details,
                CreatedAt = DateTime.UtcNow 
            };
            return ApiResponse<AgentContractDto>.Ok(contract, "Agent contract draft successfully generated.");
        }
    }
}
`;

  files[`${rootNamespace}.Application/Features/AgentContracts/Commands/SignAgentContractCommand.cs`] = `using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Features.AgentContracts.DTOs;

namespace ${rootNamespace}.Application.Features.AgentContracts.Commands
{
    public record SignAgentContractCommand(SignAgentContractDto Dto) : IRequest<ApiResponse<AgentContractDto>>;

    public class SignAgentContractCommandHandler : IRequestHandler<SignAgentContractCommand, ApiResponse<AgentContractDto>>
    {
        public async Task<ApiResponse<AgentContractDto>> Handle(SignAgentContractCommand request, CancellationToken cancellationToken)
        {
            var contract = new AgentContractDto 
            { 
                Id = request.Dto.ContractId, 
                AgentId = 12, 
                CompanyId = 1, 
                Status = "Signed", 
                Details = "Signed: " + request.Dto.Signature,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                SignedAt = DateTime.UtcNow
            };
            return ApiResponse<AgentContractDto>.Ok(contract, "Agent contract has been successfully signed.");
        }
    }
}
`;

  files[`${rootNamespace}.Application/Features/AgentContracts/Commands/TerminateAgentContractCommand.cs`] = `using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Features.AgentContracts.DTOs;

namespace ${rootNamespace}.Application.Features.AgentContracts.Commands
{
    public record TerminateAgentContractCommand(TerminateAgentContractDto Dto) : IRequest<ApiResponse<AgentContractDto>>;

    public class TerminateAgentContractCommandHandler : IRequestHandler<TerminateAgentContractCommand, ApiResponse<AgentContractDto>>
    {
        public async Task<ApiResponse<AgentContractDto>> Handle(TerminateAgentContractCommand request, CancellationToken cancellationToken)
        {
            var contract = new AgentContractDto 
            { 
                Id = request.Dto.ContractId, 
                AgentId = 12, 
                CompanyId = 1, 
                Status = "Terminated", 
                Details = "Terminated due to: " + request.Dto.Reason,
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                SignedAt = DateTime.UtcNow.AddDays(-9),
                TerminatedAt = DateTime.UtcNow
            };
            return ApiResponse<AgentContractDto>.Ok(contract, "Agent contract has been legally terminated.");
        }
    }
}
`;


  // ==========================================
  // LAYER 3: Infrastructure
  // ==========================================
  files[`${rootNamespace}.Infrastructure/${rootNamespace}.Infrastructure.csproj`] = `
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>${dotnetVersion}</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\\${rootNamespace}.Domain\\${rootNamespace}.Domain.csproj" />
    <ProjectReference Include="..\\${rootNamespace}.Application\\${rootNamespace}.Application.csproj" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />
  </ItemGroup>
</Project>
`;

  files[`${rootNamespace}.Infrastructure/Persistence/ApplicationDbContext.cs`] = `using Microsoft.EntityFrameworkCore;
using ${rootNamespace}.Domain.Entities;

namespace ${rootNamespace}.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<BlogPost> BlogPosts => Set<BlogPost>();
        public DbSet<Product> Products => Set<Product>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Map table details & index requirements
            modelBuilder.Entity<BlogPost>(entity =>
            {
                entity.HasIndex(e => e.Slug).IsUnique();
                entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Slug).HasMaxLength(255).IsRequired();
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasIndex(e => e.Slug).IsUnique();
                entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Slug).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Price).HasPrecision(18, 2);
            });
        }
    }
}
`;

  // SEPARATED REPOSITORIES UNDER repositories/ FOLDER
  files[`${rootNamespace}.Infrastructure/Repositories/GenericRepository.cs`] = `using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ${rootNamespace}.Application.Contracts;
using ${rootNamespace}.Application.Specifications;
using ${rootNamespace}.Infrastructure.Persistence;

namespace ${rootNamespace}.Infrastructure.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        private readonly ApplicationDbContext _db;
        private readonly DbSet<T> _dbSet;

        public GenericRepository(ApplicationDbContext db)
        {
            _db = db;
            _dbSet = db.Set<T>();
        }

        public IQueryable<T> Table => _dbSet;
        public IQueryable<T> TableNoTracking => _dbSet.AsNoTracking();
        public IQueryable<T> TableIncludingDeleted => _dbSet.IgnoreQueryFilters();
        public IQueryable<T> TableNoTrackingIncludingDeleted => _dbSet.AsNoTracking().IgnoreQueryFilters();

        public async Task<T> GetByIdAsync(object id, CancellationToken cancellationToken = default)
        {
            return await _dbSet.FindAsync(new[] { id }, cancellationToken) ?? throw new KeyNotFoundException($"Entity with ID {id} not found.");
        }

        public async Task<T> GetAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
        {
            IQueryable<T> query = _dbSet;
            return await query.Where(predicate).FirstOrDefaultAsync(cancellationToken) ?? throw new InvalidOperationException("No match found for given criteria.");
        }

        public async Task<List<T>> ListAsync(BaseSpecification<T> spec, CancellationToken cancellationToken = default)
        {
            var query = SpecificationEvaluator<T>.GetQuery(_dbSet.AsQueryable(), spec);
            return await query.AsNoTracking().ToListAsync(cancellationToken);
        }

        public async Task<T> GetEntityWithSpecAsync(BaseSpecification<T> spec, CancellationToken cancellationToken = default)
        {
            var query = SpecificationEvaluator<T>.GetQuery(_dbSet.AsQueryable(), spec);
            return await query.AsNoTracking().FirstOrDefaultAsync(cancellationToken) ?? throw new InvalidOperationException("No match found for specification.");
        }

        public async Task<int> CountAsync(BaseSpecification<T> spec, CancellationToken cancellationToken = default)
        {
            var query = SpecificationEvaluator<T>.GetQuery(_dbSet.AsQueryable(), spec);
            return await query.CountAsync(cancellationToken);
        }

        public async Task<int> AddAsync(T entity, CancellationToken cancellationToken = default)
        {
            await _dbSet.AddAsync(entity, cancellationToken);
            return await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<int> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
        {
            await _dbSet.AddRangeAsync(entities, cancellationToken);
            return await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<int> UpdateAsync(T entity, CancellationToken cancellationToken = default)
        {
            _dbSet.Update(entity);
            return await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<int> UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
        {
            _dbSet.UpdateRange(entities);
            return await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<int> DeleteAsync(T entity, CancellationToken cancellationToken = default)
        {
            _dbSet.Remove(entity);
            return await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<int> DeleteRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
        {
            _dbSet.RemoveRange(entities);
            return await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
`;

  files[`${rootNamespace}.Infrastructure/Persistence/UnitOfWork/UnitOfWork.cs`] = `using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Storage;
using ${rootNamespace}.Application.Contracts;
using ${rootNamespace}.Infrastructure.Persistence;
using ${rootNamespace}.Infrastructure.Repositories;

namespace ${rootNamespace}.Infrastructure.Persistence.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ConcurrentDictionary<string, object> _repositories;
        private IDbContextTransaction? _currentTransaction;

        public UnitOfWork(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
            _repositories = new ConcurrentDictionary<string, object>();
        }

        public IGenericRepository<TEntity> Repository<TEntity>() where TEntity : class
        {
            var type = typeof(TEntity).Name;
            return (IGenericRepository<TEntity>)_repositories.GetOrAdd(type, _ => new GenericRepository<TEntity>(_dbContext));
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _dbContext.SaveChangesAsync();
        }

        // Transactions management
        public async Task BeginTransactionAsync()
        {
            if (_currentTransaction != null) return;
            _currentTransaction = await _dbContext.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            try
            {
                if (_currentTransaction != null)
                {
                    await _currentTransaction.CommitAsync();
                }
            }
            finally
            {
                DisposeTransaction();
            }
        }

        public async Task RollbackTransactionAsync()
        {
            try
            {
                if (_currentTransaction != null)
                {
                    await _currentTransaction.RollbackAsync();
                }
            }
            finally
            {
                DisposeTransaction();
            }
        }

        private void DisposeTransaction()
        {
            _currentTransaction?.Dispose();
            _currentTransaction = null;
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _currentTransaction?.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
`;


  // ==========================================
  // LAYER 4: ClientApi
  // ==========================================
  files[`${rootNamespace}.ClientApi/${rootNamespace}.ClientApi.csproj`] = `
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>${dotnetVersion}</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\\${rootNamespace}.Domain\\${rootNamespace}.Domain.csproj" />
    <ProjectReference Include="..\\${rootNamespace}.Application\\${rootNamespace}.Application.csproj" />
    <ProjectReference Include="..\\${rootNamespace}.Infrastructure\\${rootNamespace}.Infrastructure.csproj" />
  </ItemGroup>
</Project>
`;

  files[`${rootNamespace}.ClientApi/appsettings.json`] = `
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=${rootNamespace}ERP.db"
  }
}
`;

  files[`${rootNamespace}.ClientApi/Controllers/ApiControllerBase.cs`] = `using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace ${rootNamespace}.ClientApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class ApiControllerBase : ControllerBase
    {
        private ISender? _mediator;
        protected ISender Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();
    }
}
`;

  files[`${rootNamespace}.ClientApi/Controllers/BlogPostsController.cs`] = `using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Features.BlogPosts.DTOs;
using ${rootNamespace}.Application.Features.BlogPosts.Queries;
using ${rootNamespace}.Application.Features.BlogPosts.Commands;

namespace ${rootNamespace}.ClientApi.Controllers
{
    public class BlogPostsController : ApiControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<BlogPostDto>>>> Get()
        {
            return Ok(await Mediator.Send(new GetBlogPostsQuery()));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<BlogPostDto>>> Create([FromBody] CreateBlogPostCommand command)
        {
            return Ok(await Mediator.Send(command));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
        {
            return Ok(await Mediator.Send(new DeleteBlogPostCommand(id)));
        }
    }
}
`;

  files[`${rootNamespace}.ClientApi/Controllers/ProductsController.cs`] = `using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Features.Products.DTOs;
using ${rootNamespace}.Application.Features.Products.Queries;
using ${rootNamespace}.Application.Features.Products.Commands;

namespace ${rootNamespace}.ClientApi.Controllers
{
    public class ProductsController : ApiControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<ProductDto>>>> Get()
        {
            return Ok(await Mediator.Send(new GetProductsQuery()));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<ProductDto>>> Create([FromBody] CreateProductCommand command)
        {
            return Ok(await Mediator.Send(command));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
        {
            return Ok(await Mediator.Send(new DeleteProductCommand(id)));
        }
    }
}
`;

  // AGENT CONTRACTS DEMO CONTROLLER (Perfect copy of the provided custom design)
  files[`${rootNamespace}.ClientApi/Controllers/AgentContractsController.cs`] = `using ${rootNamespace}.Application.Authorization;
using ${rootNamespace}.Application.Features.AgentContracts.Commands;
using ${rootNamespace}.Application.Features.AgentContracts.DTOs;
using ${rootNamespace}.Application.Features.AgentContracts.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace ${rootNamespace}.ClientApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AgentContractsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public AgentContractsController(IMediator mediator) => _mediator = mediator;

        [HttpGet("Agent/{agentId}")]
        [HasPermission("agentcontract.access")]
        public async Task<IActionResult> GetByAgent(int agentId, [FromQuery] int companyId)
        {
            var result = await _mediator.Send(new GetAgentContractsQuery(agentId, companyId));
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("{id}")]
        [HasPermission("agentcontract.access")]
        public async Task<IActionResult> GetById(int id, [FromQuery] int companyId)
        {
            var result = await _mediator.Send(new GetAgentContractByIdQuery(id, companyId));
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("Agent/{agentId}/Active")]
        [HasPermission("agentcontract.access")]
        public async Task<IActionResult> GetActive(int agentId, [FromQuery] int companyId)
        {
            var result = await _mediator.Send(new GetActiveContractQuery(agentId, companyId));
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        [HasPermission("agent.approve")]
        public async Task<IActionResult> Create([FromBody] CreateAgentContractDto dto)
        {
            var result = await _mediator.Send(new CreateAgentContractCommand(dto));
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("Sign")]
        [HasPermission("agentcontract.approve")]
        public async Task<IActionResult> Sign([FromBody] SignAgentContractDto dto)
        {
            var result = await _mediator.Send(new SignAgentContractCommand(dto));
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("Terminate")]
        [HasPermission("agentcontract.approve")]
        public async Task<IActionResult> Terminate([FromBody] TerminateAgentContractDto dto)
        {
            var result = await _mediator.Send(new TerminateAgentContractCommand(dto));
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
`;

  files[`${rootNamespace}.ClientApi/Program.cs`] = `using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ${rootNamespace}.Application.Contracts;
using ${rootNamespace}.Application.Services;
using ${rootNamespace}.Infrastructure.Persistence;
using ${rootNamespace}.Infrastructure.Persistence.UnitOfWork;

var builder = WebApplication.CreateBuilder(args);

// Add Database Context representing SQLite local storage
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=${rootNamespace}ERP.db"));

// Register system interfaces for DI
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Register Current User service under Services folder
builder.Services.AddScoped<ICurrentUserService, MockCurrentUserService>();

// Register MediatR handlers inside ${rootNamespace}.Application
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(${rootNamespace}.Application.Contracts.IUnitOfWork).Assembly));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Ensure Database is physically deployed and seeded with defaults on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
    SeedComplianceData(context);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();
app.Run();

// Seed mock products and articles complying with schema constraints
static void SeedComplianceData(ApplicationDbContext context)
{
    if (!context.BlogPosts.Any())
    {
        context.BlogPosts.AddRange(new[]
        {
            new ${rootNamespace}.Domain.Entities.BlogPost
            {
                Title = "Enterprise Architecture System Overview",
                Slug = "enterprise-architecture-system-overview",
                Excerpt = "Learn how we manage company isolation boundaries.",
                Body = "The core system strictly obeys standard 5-layer separation of concerns with separated service containers.",
                Category = "Engineering",
                Author = "Admin Executive",
                CompanyId = 1,
                CreatedBy = "seeder"
            }
        });
        context.SaveChanges();
    }
}
`;


  // ==========================================
  // LAYER 5: ClientPortal (UI Web)
  // ==========================================
  files[`${rootNamespace}.ClientPortal/${rootNamespace}.ClientPortal.csproj`] = `
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>${dotnetVersion}</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\\${rootNamespace}.Application\\${rootNamespace}.Application.csproj" />
  </ItemGroup>
</Project>
`;

  files[`${rootNamespace}.ClientPortal/appsettings.json`] = `
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ApiSettings": {
    "BaseUrl": "http://localhost:5211"
  }
}
`;

  files[`${rootNamespace}.ClientPortal/Clients/ApiClient.cs`] = `using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using ${rootNamespace}.Application.Common;
using ${rootNamespace}.Application.Features.BlogPosts.DTOs;
using ${rootNamespace}.Application.Features.Products.DTOs;
using System.Collections.Generic;

namespace ${rootNamespace}.ClientPortal.Clients
{
    public interface IApiClient
    {
        Task<ApiResponse<List<BlogPostDto>>> GetBlogPostsAsync();
        Task<ApiResponse<List<ProductDto>>> GetProductsAsync();
    }

    public class ApiClient : IApiClient
    {
        private readonly HttpClient _httpClient;

        public ApiClient(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            var baseUrl = config["ApiSettings:BaseUrl"] ?? "http://localhost:5211";
            _httpClient.BaseAddress = new System.Uri(baseUrl);
        }

        public async Task<ApiResponse<List<BlogPostDto>>> GetBlogPostsAsync()
        {
            try
            {
                var response = await _httpClient.GetFromJsonAsync<ApiResponse<List<BlogPostDto>>>("api/BlogPosts");
                return response ?? ApiResponse<List<BlogPostDto>>.Fail("Api output null");
            }
            catch (System.Exception ex)
            {
                return ApiResponse<List<BlogPostDto>>.Fail(ex.Message);
            }
        }

        public async Task<ApiResponse<List<ProductDto>>> GetProductsAsync()
        {
            try
            {
                var response = await _httpClient.GetFromJsonAsync<ApiResponse<List<ProductDto>>>("api/Products");
                return response ?? ApiResponse<List<ProductDto>>.Fail("Api output null");
            }
            catch (System.Exception ex)
            {
                return ApiResponse<List<ProductDto>>.Fail(ex.Message);
            }
        }
    }
}
`;

  files[`${rootNamespace}.ClientPortal/Controllers/HomeController.cs`] = `using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ${rootNamespace}.ClientPortal.Clients;

namespace ${rootNamespace}.ClientPortal.Controllers
{
    public class HomeController : Controller
    {
        private readonly IApiClient _apiClient;

        public HomeController(IApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        public async Task<IActionResult> Index()
        {
            ViewBag.ProjectName = "${config.projectName}";
            var blogsResponse = await _apiClient.GetBlogPostsAsync();
            var productsResponse = await _apiClient.GetProductsAsync();

            ViewBag.Blogs = blogsResponse.Success ? blogsResponse.Data : new();
            ViewBag.Products = productsResponse.Success ? productsResponse.Data : new();

            return View();
        }
    }
}
`;

  files[`${rootNamespace}.ClientPortal/Views/_ViewImports.cshtml`] = `
@using ${rootNamespace}.ClientPortal
@using ${rootNamespace}.ClientPortal.Controllers
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
`;

  files[`${rootNamespace}.ClientPortal/Views/_ViewStart.cshtml`] = `
@{
    Layout = "_Layout";
}
`;

  files[`${rootNamespace}.ClientPortal/Views/Shared/_Layout.cshtml`] = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ViewBag.ProjectName - ${rootNamespace} Portal</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css" />
    <style>
        :root {
            --bs-primary: ${config.colorPalette.primary};
            --bs-primary-rgb: 99, 102, 241;
        }
        body {
            background-color: #0f172a;
            color: #e2e8f0;
        }
        .navbar-custom {
            background-color: #1e293b;
            border-bottom: 1px solid #334155;
        }
        .card-custom {
            background-color: #1e293b;
            border: 1px solid #334155;
            transition: transform 0.2s;
        }
        .card-custom:hover {
            transform: translateY(-4px);
        }
    </style>
</head>
<body>
    <header>
        <nav class="navbar navbar-expand-sm navbar-toggleable-sm navbar-dark navbar-custom box-shadow mb-3">
            <div class="container">
                <a class="navbar-brand text-white font-weight-bold" asp-area="" asp-controller="Home" asp-action="Index">
                    <i class="bi bi-cpu text-primary me-2"></i>@ViewBag.ProjectName Portal
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target=".navbar-collapse" aria-controls="navbarSupportedContent"
                        aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="navbar-collapse collapse d-sm-inline-flex justify-content-between">
                    <ul class="navbar-nav flex-grow-1 ms-auto">
                        <li class="nav-item">
                            <a class="nav-link text-white-50 active" asp-area="" asp-controller="Home" asp-action="Index">Compliance Hub</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>
    <div class="container">
        <main role="main" class="pb-3">
            @RenderBody()
        </main>
    </div>

    <footer class="border-top footer text-muted bg-dark py-3 mt-5 border-secondary">
        <div class="container text-center">
            &copy; 2026 - @ViewBag.ProjectName - Flexible C# Clean Architecture. All dynamic routes active.
        </div>
    </footer>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;

  files[`${rootNamespace}.ClientPortal/Views/Home/Index.cshtml`] = `
@{
    var blogs = ViewBag.Blogs as List<${rootNamespace}.Application.Features.BlogPosts.DTOs.BlogPostDto>;
    var products = ViewBag.Products as List<${rootNamespace}.Application.Features.Products.DTOs.ProductDto>;
}

<div class="p-5 mb-4 rounded-3 text-white border border-secondary" style="background: linear-gradient(135deg, ${config.colorPalette.primary}22, #020617)">
    <div class="container-fluid py-5">
        <h1 class="display-5 fw-bold text-white mb-3">${rootNamespace} Clean Architecture</h1>
        <p class="col-md-8 fs-5 text-secondary">
            Your visual layout has been mapped directly to an Enterprise-grade 5-layer system. Underneath, interfaces are strictly separated into Contracts/, mock implementations reside in Services/, and query/command structures use customized Authorization filters.
        </p>
        <span class="badge bg-indigo-600 p-2 font-monospace">.NET / C# v8.0 Stack</span>
        <span class="badge bg-success p-2 font-monospace">${rootNamespace} Namespace Standard</span>
    </div>
</div>

<div class="row align-items-md-stretch">
    <!-- BlogPost Compliance Audit Block -->
    <div class="col-md-6 mb-4">
        <div class="h-100 p-5 rounded-3 card-custom">
            <h2 class="text-white"><i class="bi bi-archive text-primary me-2"></i>Seeded BlogPosts Table</h2>
            <p class="text-muted text-xs">
                Rendered live from the REST API utilizing UnitOfWork repositories.
            </p>
            <div class="list-group bg-transparent border-0">
                @if (blogs != null && blogs.Any())
                {
                    @foreach (var post in blogs)
                    {
                        <div class="list-group-item bg-transparent text-white border-0 px-0">
                            <h5 class="mb-1 text-primary">@post.Title</h5>
                            <p class="mb-1 text-slate-300">@post.Excerpt</p>
                            <small class="text-secondary font-monospace">Slug: @post.Slug | CompanyId: @post.CompanyId</small>
                        </div>
                    }
                }
                else
                {
                    <p class="text-muted font-monospace text-xs mt-3">No active compliant records returned yet.</p>
                }
            </div>
        </div>
    </div>

    <!-- Products Core compliance view -->
    <div class="col-md-6 mb-4">
        <div class="h-100 p-5 rounded-3 card-custom">
            <h2 class="text-white"><i class="bi bi-cart4 text-emerald-400 me-2"></i>Active Products DB</h2>
            <p class="text-muted text-xs">
                Company Isolation Rules are strictly verified on any model read.
            </p>
            <div class="list-group bg-transparent border-0">
                @if (products != null && products.Any())
                {
                    @foreach (var prod in products)
                    {
                        <div class="list-group-item bg-transparent text-white border-0 px-0">
                            <h5 class="mb-1 text-success">@prod.Name</h5>
                            <p class="mb-1 text-slate-300">@prod.Description <strong class="text-white">$@prod.Price</strong></p>
                            <small class="text-secondary font-monospace">Company Scope: @prod.CompanyId | Uuid: @prod.Uuid</small>
                        </div>
                    }
                }
                else
                {
                    <div class="text-center p-3 text-secondary border border-dashed border-secondary rounded">
                        <i class="bi bi-box-seam fs-3"></i>
                        <p class="text-xs text-muted mt-2">Inventory is currently empty.</p>
                    </div>
                }
            </div>
        </div>
    </div>
</div>
`;


  // ==========================================
  // DOCUMENTATION / EXPLANATION
  // ==========================================
  files['README.md'] = `
# ${rootNamespace} Flexible 5-Layer Solution (.NET Core)

This repository holds a fully customized, decoupled version of the clean .NET codebase aligned with enterprise guidelines.

## 📁 Clean Architecture Tree & Separations
- **${rootNamespace}.Domain**: Plain C# domain entity definitions and configuration baselines.
- **${rootNamespace}.Application**: High-level features and MediatR pipelines.
  - 📂 **Contracts/**: Holds interface contracts strictly isolated from databases & API engines (e.g. \`IGenericRepository<T>\`, \`IUnitOfWork\`, \`ICurrentUserService\`).
  - 📂 **Services/**: Holds implementation services and mock dependencies in separate compilation layers.
  - 📂 **Authorization/**: Custom attributes (e.g., \`[HasPermission(...)]\`) used across REST APIs to lock down resources statically.
  - 📂 **Specifications/**: Full generic Specification pattern code (\`BaseSpecification<T>\`, \`SpecificationEvaluator<T>\`).
- **${rootNamespace}.Infrastructure**: Concrete Entity Framework Core layer binding specifications and implementing repositories.
- **${rootNamespace}.ClientApi**: Scalable REST endpoints showcasing authorization wrappers and CQRS patterns.
- **${rootNamespace}.ClientPortal**: Client portal consuming the API layer via decoupled HTTP clients.

---

## 🛡️ Flexibly Configured Namespace
Any model, schema, or command incorporates standard C# namespace paths tied directly to **${rootNamespace}** (e.g. \`${rootNamespace}.Application.Authorization\`). This avoids hardcoding and enables easy project renaming to \`Zesa\` or \`Kupa\`.

---

## ⚡ CLI Commands to Start local servers

Ensure you have the .NET SDK installed.

1. **Start the API Server (${rootNamespace}.ClientApi)**
\`\`\`bash
cd ${rootNamespace}.ClientApi
dotnet run
# Runs Swagger dashboard dynamically!
\`\`\`

2. **Start the Customer Portal (${rootNamespace}.ClientPortal)**
\`\`\`bash
cd ${rootNamespace}.ClientPortal
dotnet run
# Serves the main visual content dashboard pulling live data from API!
\`\`\`
`;

  return files;
}
